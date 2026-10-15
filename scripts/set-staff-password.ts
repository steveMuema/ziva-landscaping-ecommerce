/**
 * Create a staff account, or set up how a staff member signs in.
 *
 * This is the only way to bootstrap the first admin: there is no special login path
 * in the app. It needs direct database access, so only people who hold DATABASE_URL
 * can run it. Any run also clears a sign-in lockout on the account.
 *
 * Usage:
 *   npm run staff:set-password -- you@example.com                        set/reset password (admin)
 *   npm run staff:set-password -- writer@example.com --role editor
 *   npm run staff:set-password -- you@example.com --authenticator-only   sign in with an authenticator
 *                                                                        app only (no password); shows a
 *                                                                        QR code to scan
 *   npm run staff:set-password -- you@example.com --disable-2fa          lost authenticator: turn 2FA off
 *                                                                        and set a password
 *
 * Against production:
 *   DATABASE_URL="postgres://…" npm run staff:set-password -- you@example.com
 */
import { createInterface } from "readline";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { PrismaClient } from "@prisma/client";

const MIN_LENGTH = 12;
const STAFF_ROLES = ["admin", "editor"] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

function ask(question: string, { hidden = false } = {}): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Print the prompt, then swallow echoed characters so the password never shows.
      const internals = rl as unknown as { _writeToOutput: (s: string) => void };
      const write = internals._writeToOutput.bind(rl);
      let prompted = false;
      internals._writeToOutput = (s: string) => {
        if (!prompted) {
          write(s);
          prompted = true;
        }
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

function databaseLabel(url: string | undefined): string {
  if (!url) return "(DATABASE_URL is not set)";
  try {
    const u = new URL(url);
    return `${u.hostname}${u.port ? `:${u.port}` : ""}${u.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

async function askPassword(): Promise<string | null> {
  const password = await ask(`New password (at least ${MIN_LENGTH} characters): `, { hidden: true });
  if (password.length < MIN_LENGTH) {
    console.error(`Password must be at least ${MIN_LENGTH} characters. Nothing was changed.`);
    return null;
  }
  const again = await ask("Repeat password: ", { hidden: true });
  if (again !== password) {
    console.error("Passwords don't match. Nothing was changed.");
    return null;
  }
  return password;
}

/** Show a new authenticator secret as a QR code and confirm the user can produce a valid code. */
async function enrollAuthenticator(email: string): Promise<string | null> {
  const secret = speakeasy.generateSecret({ name: `Ziva Landscaping (${email})`, length: 20 });
  console.log("\nScan this QR code with your authenticator app (Google Authenticator, Authy, 1Password…):\n");
  console.log(await QRCode.toString(secret.otpauth_url!, { type: "terminal", small: true }));
  console.log(`Or enter this key manually: ${secret.base32}\n`);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const code = (await ask("Enter the 6-digit code from the app: ")).replace(/\s+/g, "");
    if (speakeasy.totp.verify({ secret: secret.base32, encoding: "base32", token: code, window: 1 })) return secret.base32;
    console.log("That code didn't match. Wait for a new code and try again.");
  }
  console.error("Too many wrong codes. Nothing was changed.");
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const roleFlag = args.indexOf("--role");
  const requestedRole = roleFlag >= 0 ? (args[roleFlag + 1] as StaffRole) : undefined;
  const disable2fa = args.includes("--disable-2fa");
  const authenticatorOnly = args.includes("--authenticator-only");
  const emailArg = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--role");

  if (requestedRole && !STAFF_ROLES.includes(requestedRole)) {
    console.error(`--role must be one of: ${STAFF_ROLES.join(", ")}`);
    process.exit(1);
  }
  if (disable2fa && authenticatorOnly) {
    console.error("--disable-2fa and --authenticator-only can't be used together.");
    process.exit(1);
  }
  if (!process.stdin.isTTY) {
    console.error("Run this in an interactive terminal (it prompts for input).");
    process.exit(1);
  }

  const email = (emailArg ?? (await ask("Email: "))).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("That doesn't look like an email address.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, twoFactorEnabled: true },
    });
    const role: StaffRole =
      requestedRole ?? (existing && STAFF_ROLES.includes(existing.role as StaffRole) ? (existing.role as StaffRole) : "admin");

    console.log("");
    console.log(`Database: ${databaseLabel(process.env.DATABASE_URL)}`);
    console.log(existing ? `Account:  ${email} (currently ${existing.role}) → ${role}` : `Account:  ${email} (new) → ${role}`);
    if (authenticatorOnly) {
      console.log("Sign-in:  authenticator app only — any password is removed and a new authenticator is enrolled");
    } else if (disable2fa) {
      console.log("Sign-in:  password only — 2FA is turned OFF (re-enable it in Admin → My account)");
    } else if (existing?.twoFactorEnabled) {
      console.log("Sign-in:  new password plus your existing authenticator code");
    } else {
      console.log("Sign-in:  password");
    }
    const confirm = await ask('Type "yes" to continue: ');
    if (confirm.trim().toLowerCase() !== "yes") {
      console.log("Cancelled. Nothing was changed.");
      return;
    }

    let data: { password?: string | null; twoFactorEnabled?: boolean; twoFactorSecret?: string | null };
    if (authenticatorOnly) {
      const secret = await enrollAuthenticator(email);
      if (!secret) {
        process.exitCode = 1;
        return;
      }
      data = { password: null, twoFactorEnabled: true, twoFactorSecret: secret };
    } else {
      const password = await askPassword();
      if (!password) {
        process.exitCode = 1;
        return;
      }
      data = { password: await bcrypt.hash(password, 12) };
      if (disable2fa) Object.assign(data, { twoFactorEnabled: false, twoFactorSecret: null });
    }

    const unlock = { failedLoginCount: 0, lockedUntil: null };
    const user = existing
      ? await prisma.user.update({ where: { email }, data: { ...data, ...unlock, role } })
      : await prisma.user.create({ data: { ...data, email, name: email.split("@")[0], role } });

    const how = authenticatorOnly ? "authenticator only" : disable2fa ? "password, 2FA off" : "password";
    await prisma.auditLog
      .create({
        data: {
          userId: user.id,
          userEmail: "command line",
          action: existing ? "user.signin_reset" : "user.create",
          entity: "User",
          entityId: user.id,
          summary: `${existing ? "Reset sign-in for" : "Created"} ${email} as ${role} (${how}) via staff:set-password`,
        },
      })
      .catch(() => undefined); // older databases may not have the audit table yet

    console.log(`\nDone. ${email} can now sign in at /auth/signin as ${role} (${how}).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
