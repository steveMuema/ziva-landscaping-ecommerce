/** Role names and admin-area permissions. No server imports, so middleware can use it. */

export const ROLES = ["superadmin", "admin", "editor", "user"] as const;
export type Role = (typeof ROLES)[number];
export type StaffRole = Extract<Role, "superadmin" | "admin" | "editor">;
export type AdminRole = Extract<Role, "superadmin" | "admin">;

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "Super admin",
  admin: "Admin",
  editor: "Editor",
  user: "User",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isStaffRole(value: unknown): value is StaffRole {
  return value === "superadmin" || value === "admin" || value === "editor";
}

/** Admins and super admins: full admin area (orders, settings, users…). */
export function isAdminRole(value: unknown): value is AdminRole {
  return value === "superadmin" || value === "admin";
}

/**
 * Roles an actor may create, edit, assign or delete:
 * - the super admin manages admins, editors and users
 * - admins manage editors and users only, so one admin can't lock out another
 * - editors and users manage nobody
 * There is only ever one super admin; the role is never assigned, only transferred
 * (see transferSuperadmin), so it isn't in anyone's list.
 */
export function manageableRoles(actorRole: unknown): Role[] {
  if (actorRole === "superadmin") return ["admin", "editor", "user"];
  if (actorRole === "admin") return ["editor", "user"];
  return [];
}

/** Who the super admin role can be handed to: any other staff member. */
export function canReceiveSuperadmin(role: unknown): boolean {
  return role === "admin" || role === "editor";
}

export function canManageRole(actorRole: unknown, targetRole: unknown): boolean {
  return isRole(targetRole) && manageableRoles(actorRole).includes(targetRole);
}

/**
 * Admin sections an editor may open: catalog, blog and site content.
 * Orders, payments, finance, users and settings stay admin-only.
 */
export const EDITOR_PATHS = [
  "/admin/products",
  "/admin/categories",
  "/admin/subcategories",
  "/admin/blog",
  "/admin/comments",
  "/admin/content",
  "/admin/media",
  "/admin/account",
  "/admin/settings/security",
] as const;

/** Where an editor lands when opening /admin. */
export const EDITOR_HOME = "/admin/products";

export function canAccessAdminPath(role: unknown, pathname: string): boolean {
  if (isAdminRole(role)) return true;
  if (role !== "editor") return false;
  return EDITOR_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
