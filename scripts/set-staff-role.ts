/**
 * Change a user's role without touching their password or authenticator.
 * Needs direct database access. Use it to appoint the first super admin, or as the
 * emergency route if the super admin can't sign in.
 *
 * There is only ever one super admin: giving someone the role transfers it, and the
 * previous super admin becomes an admin in the same transaction.
 *
 *   npm run staff:set-role -- you@example.com superadmin
 *   npm run staff:set-role -- you@example.com superadmin --yes     (skip the confirmation)
 *   DATABASE_URL="postgres://…" npm run staff:set-role -- you@example.com superadmin
 *
 * Roles: superadmin, admin, editor, user. Their current sign-ins end so the new role
 * takes effect cleanly.
 */
import { createInterface } from "readline";
import { PrismaClient } from "@prisma/client";

const ROLES = ["superadmin", "admin", "editor", "user"];

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function databaseLabel(url: string | undefined): string {
  try {
    const u = new URL(url ?? "");
    return `${u.hostname}${u.port ? `:${u.port}` : ""}${u.pathname}`;
  } catch {
    return "(DATABASE_URL is not set)";
  }
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--yes");
  const skipConfirm = process.argv.includes("--yes");
  const [emailArg, role] = args;
  const email = (emailArg ?? "").trim().toLowerCase();
  if (!email || !role || !ROLES.includes(role)) {
    console.error(`Usage: npm run staff:set-role -- <email> <${ROLES.join("|")}> [--yes]`);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
    if (!user) {
      console.error(`No account with the email ${email}. Create it with: npm run staff:set-password -- ${email} --role ${role}`);
      process.exitCode = 1;
      return;
    }
    if (user.role === role) {
      console.log(`${email} is already ${role}. Nothing to change.`);
      return;
    }
    if (user.role === "superadmin") {
      console.error("This is the super admin. To change that, give the role to someone else (it transfers):");
      console.error("  npm run staff:set-role -- <their email> superadmin");
      process.exitCode = 1;
      return;
    }
    const current =
      role === "superadmin"
        ? await prisma.user.findFirst({ where: { role: "superadmin" }, select: { id: true, email: true } })
        : null;

    console.log(`Database: ${databaseLabel(process.env.DATABASE_URL)}`);
    console.log(`Account:  ${email}: ${user.role} → ${role}`);
    if (current) console.log(`Transfer: ${current.email} stops being super admin and becomes admin`);
    if (!skipConfirm) {
      if (!process.stdin.isTTY) {
        console.error("Pass --yes to run without a terminal.");
        process.exitCode = 1;
        return;
      }
      if ((await ask('Type "yes" to continue: ')).trim().toLowerCase() !== "yes") {
        console.log("Cancelled. Nothing was changed.");
        return;
      }
    }

    // Demote the current super admin first: the database allows only one at a time.
    await prisma.$transaction([
      ...(current ? [prisma.user.update({ where: { id: current.id }, data: { role: "admin" } })] : []),
      prisma.user.update({ where: { id: user.id }, data: { role, sessionsValidAfter: new Date() } }),
    ]);
    await prisma.auditLog
      .create({
        data: {
          userId: user.id,
          userEmail: "command line",
          action: "user.role",
          entity: "User",
          entityId: user.id,
          summary: current
            ? `Transferred super admin from ${current.email} to ${email} via staff:set-role`
            : `Changed ${email} from ${user.role} to ${role} via staff:set-role`,
          changes: { role: { from: user.role, to: role } },
        },
      })
      .catch(() => undefined);
    console.log(`Done. ${email} is now ${role}. They need to sign in again.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
