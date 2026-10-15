import bcryptjs from "bcryptjs";
import type { Prisma, User } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ROLE_LABELS, canManageRole, canReceiveSuperadmin, isRole, type Role } from "@/lib/roles";
import { SignInError, verifyCredentials } from "@/lib/credentials-auth";
import type { AdminUser } from "@/lib/admin-auth";
import type { AuditChanges } from "@/lib/audit";

export const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 200;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** What the users page sees. Never includes the password hash or 2FA secret. */
export type ManagedUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  hasPassword: boolean;
  twoFactorEnabled: boolean;
  locked: boolean;
  createdAt: string;
};

export function toManagedUser(u: User): ManagedUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    hasPassword: Boolean(u.password),
    twoFactorEnabled: u.twoFactorEnabled && Boolean(u.twoFactorSecret),
    locked: Boolean(u.lockedUntil && u.lockedUntil > new Date()),
    createdAt: u.createdAt.toISOString(),
  };
}

export class UserAdminError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function roleLabel(role: string): string {
  return isRole(role) ? ROLE_LABELS[role] : role;
}

function checkPassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) throw new UserAdminError(`Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (password.length > MAX_PASSWORD_LENGTH) throw new UserAdminError("That password is too long.");
}

async function checkEmail(email: string, excludeId?: string) {
  if (!EMAIL.test(email) || email.length > 254) throw new UserAdminError("Enter a valid email address.");
  const taken = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  });
  if (taken) throw new UserAdminError("Another account already uses that email.");
}

function cleanName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  if (trimmed.length > 100) throw new UserAdminError("Keep the name under 100 characters.");
  return trimmed || null;
}

// ── Create ──────────────────────────────────────────────────────────────────

export type CreateUserInput = { name?: unknown; email?: unknown; role?: unknown; password?: unknown };

export async function createUser(actor: AdminUser, input: CreateUserInput) {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const role = input.role;
  const password = typeof input.password === "string" ? input.password : "";
  if (!isRole(role)) throw new UserAdminError("Choose a role.");
  if (role === "superadmin") throw new UserAdminError("There's only one super admin. Use “Transfer super admin” to hand it over.");
  if (!canManageRole(actor.role, role)) {
    throw new UserAdminError(`You can't create ${roleLabel(role)} accounts.`, 403);
  }
  await checkEmail(email);
  checkPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      name: cleanName(input.name),
      role,
      password: await bcryptjs.hash(password, 12),
    },
  });
  return {
    user,
    audit: { action: "user.create", summary: `Created ${email} as ${roleLabel(role)}` },
  };
}

// ── Update ──────────────────────────────────────────────────────────────────

export type UpdateUserInput = {
  name?: unknown;
  email?: unknown;
  role?: unknown;
  /** New password, set by the admin. Ends the user's other sessions. */
  password?: unknown;
  /** Turn off 2FA (lost authenticator). Requires a password to remain. */
  disable2fa?: unknown;
  /** Clear a lockout from too many failed sign-ins. */
  unlock?: unknown;
  /** End all of this user's current sign-ins. */
  signOutEverywhere?: unknown;
};

export async function updateUser(actor: AdminUser, targetId: string, input: UpdateUserInput) {
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new UserAdminError("User not found.", 404);
  const self = target.id === actor.id;

  const wantsSecurityChange =
    input.password !== undefined || input.disable2fa === true || input.unlock === true ||
    input.signOutEverywhere === true || (input.role !== undefined && input.role !== target.role);

  if (self && wantsSecurityChange) {
    throw new UserAdminError("Change your own password, 2FA or role from My account, not here.");
  }
  if (!self && target.role === "superadmin") {
    throw new UserAdminError("Only the super admin can change their own account.", 403);
  }
  if (!self && !canManageRole(actor.role, target.role)) {
    throw new UserAdminError(`You can't edit ${roleLabel(target.role)} accounts.`, 403);
  }

  const data: Prisma.UserUpdateInput = {};
  const changes: AuditChanges = {};
  const actions: string[] = [];
  let endSessions = false;

  if (input.name !== undefined) {
    const name = cleanName(input.name);
    if (name !== target.name) {
      data.name = name;
      changes.name = { from: target.name, to: name };
    }
  }

  if (input.email !== undefined) {
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    if (email !== target.email) {
      await checkEmail(email, target.id);
      data.email = email;
      changes.email = { from: target.email, to: email };
    }
  }

  if (input.role !== undefined && input.role !== target.role) {
    const role = input.role;
    if (!isRole(role)) throw new UserAdminError("Choose a valid role.");
    if (role === "superadmin") throw new UserAdminError("There's only one super admin. Use “Transfer super admin” to hand it over.");
    if (!canManageRole(actor.role, role)) throw new UserAdminError(`You can't make someone ${roleLabel(role)}.`, 403);
    data.role = role as Role;
    changes.role = { from: target.role, to: role };
    endSessions = true;
  }

  let hasPasswordAfter = Boolean(target.password);
  if (input.password !== undefined) {
    const password = typeof input.password === "string" ? input.password : "";
    checkPassword(password);
    data.password = await bcryptjs.hash(password, 12);
    data.failedLoginCount = 0;
    data.lockedUntil = null;
    hasPasswordAfter = true;
    changes.password = { from: "(hidden)", to: "(changed)" };
    actions.push("set a new password");
    endSessions = true;
  }

  if (input.disable2fa === true && (target.twoFactorEnabled || target.twoFactorSecret)) {
    if (!hasPasswordAfter) {
      throw new UserAdminError("This account signs in with its authenticator only. Set a password at the same time, or they won't be able to sign in.");
    }
    data.twoFactorEnabled = false;
    data.twoFactorSecret = null;
    data.lastTotpStep = null;
    changes.twoFactorEnabled = { from: true, to: false };
    actions.push("turned off 2FA");
    endSessions = true;
  }

  if (input.unlock === true && (target.lockedUntil || target.failedLoginCount > 0)) {
    data.failedLoginCount = 0;
    data.lockedUntil = null;
    actions.push("unlocked sign-in");
  }

  if (input.signOutEverywhere === true) {
    actions.push("signed them out everywhere");
    endSessions = true;
  }

  if (endSessions) data.sessionsValidAfter = new Date();

  if (Object.keys(data).length === 0) return { user: target, audit: null };

  const user = await prisma.user.update({ where: { id: target.id }, data });
  const edited = Object.keys(changes).filter((k) => k !== "password" && k !== "twoFactorEnabled");
  const summaryParts = [...(edited.length ? [`edited ${edited.join(", ")}`] : []), ...actions];
  return {
    user,
    audit: {
      action: "user.update",
      summary: `${target.email ?? target.id}: ${summaryParts.join("; ")}`,
      changes,
    },
  };
}

// ── Delete ──────────────────────────────────────────────────────────────────

export async function deleteUser(actor: AdminUser, targetId: string) {
  if (targetId === actor.id) throw new UserAdminError("You can't delete your own account.");
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new UserAdminError("User not found.", 404);
  if (target.role === "superadmin") {
    throw new UserAdminError("The super admin can't be deleted. Transfer the role to someone else first.", 403);
  }
  if (!canManageRole(actor.role, target.role)) {
    throw new UserAdminError(`You can't delete ${roleLabel(target.role)} accounts.`, 403);
  }
  await prisma.user.delete({ where: { id: target.id } });
  return { audit: { action: "user.delete", summary: `Deleted ${target.email ?? target.id} (${roleLabel(target.role)})` } };
}

// ── Transfer super admin ────────────────────────────────────────────────────

/**
 * Hand the single super admin role to another staff member. The current super admin
 * becomes an admin in the same transaction, so there is never zero or two (the database
 * also enforces at most one). The super admin re-confirms with their own password and/or
 * authenticator code; wrong attempts count towards the normal sign-in lockout.
 */
export async function transferSuperadmin(
  actor: AdminUser,
  input: { targetId?: unknown; password?: unknown; totpCode?: unknown }
) {
  if (actor.role !== "superadmin") throw new UserAdminError("Only the super admin can transfer the role.", 403);
  const targetId = typeof input.targetId === "string" ? input.targetId : "";
  if (!targetId || targetId === actor.id) throw new UserAdminError("Choose who should become super admin.");

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new UserAdminError("User not found.", 404);
  if (!canReceiveSuperadmin(target.role)) {
    throw new UserAdminError("The super admin role can only go to an admin or editor.");
  }
  if (!target.password && !(target.twoFactorEnabled && target.twoFactorSecret)) {
    throw new UserAdminError("That account has no way to sign in yet. Set a password for it first.");
  }

  // Re-check the super admin's own credentials before giving the role away.
  let confirmed = null;
  try {
    confirmed = await verifyCredentials({
      email: actor.email ?? "",
      password: typeof input.password === "string" ? input.password : "",
      totpCode: typeof input.totpCode === "string" ? input.totpCode : "",
    });
  } catch (error) {
    if (error instanceof SignInError) throw new UserAdminError(error.message, 403);
    throw error;
  }
  if (!confirmed || confirmed.id !== actor.id) {
    throw new UserAdminError("That didn't match your sign-in details. Nothing was changed.", 403);
  }

  // Demote first: the unique index allows only one super admin at any moment.
  await prisma.$transaction([
    prisma.user.update({ where: { id: actor.id }, data: { role: "admin" } }),
    prisma.user.update({ where: { id: target.id }, data: { role: "superadmin" } }),
  ]);

  return {
    target,
    audit: {
      action: "user.superadmin_transfer",
      summary: `Transferred super admin from ${actor.email} to ${target.email} (${actor.email} is now Admin)`,
      changes: { superadmin: { from: actor.email, to: target.email } } as AuditChanges,
    },
  };
}
