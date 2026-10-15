import bcryptjs from "bcryptjs";
import speakeasy from "speakeasy";
import prisma from "@/lib/prisma";

const MAX_FAILURES = 5;
const LOCK_MINUTES = 15;
/** Compared against when the email is unknown, so timing doesn't reveal which emails exist. */
const DUMMY_HASH = bcryptjs.hashSync("no-such-account", 10);

export type SignedInUser = { id: string; name: string | null; email: string | null; role: string };

/** Thrown for failures the sign-in page shows as-is. Anything else is a generic "invalid" error. */
export class SignInError extends Error {}

/**
 * Check an email + password and/or authenticator code.
 *
 * - Accounts with a password: password, plus the authenticator code when 2FA is on.
 * - Authenticator-only accounts (2FA on, no password): the authenticator code alone.
 * - Accounts with neither can't sign in; set a password with `npm run staff:set-password`.
 *
 * Nothing here creates accounts or enrolls authenticators. After MAX_FAILURES wrong attempts
 * the account is locked for LOCK_MINUTES, so codes and passwords can't be guessed online.
 * Returns null for wrong credentials (shown as "Invalid email or password").
 */
export async function verifyCredentials(input: {
  email?: string;
  password?: string;
  totpCode?: string;
}): Promise<SignedInUser | null> {
  const email = input.email?.trim().toLowerCase();
  const password = input.password ?? "";
  const totpCode = (input.totpCode ?? "").replace(/\s+/g, "");
  if (!email) return null;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Same work as a real check, so response time doesn't reveal whether the email exists.
    await bcryptjs.compare(password || "x", DUMMY_HASH);
    return null;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new SignInError(`Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
  }

  const has2fa = user.twoFactorEnabled && Boolean(user.twoFactorSecret);
  /** The 30-second step of the accepted code; codes are single-use. */
  let acceptedStep: number | null = null;
  const codeIsValid = () => {
    if (!has2fa || !/^\d{6}$/.test(totpCode)) return false;
    const match = speakeasy.totp.verifyDelta({ secret: user.twoFactorSecret!, encoding: "base32", token: totpCode, window: 1 });
    if (!match) return false;
    const step = Math.floor(Date.now() / 1000 / 30) + match.delta;
    if (user.lastTotpStep != null && step <= user.lastTotpStep) return false; // already used
    acceptedStep = step;
    return true;
  };

  const fail = async (): Promise<null> => {
    const failures = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data:
        failures >= MAX_FAILURES
          ? { failedLoginCount: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60000) }
          : { failedLoginCount: failures },
    });
    return null;
  };

  if (user.password) {
    if (!password || !(await bcryptjs.compare(password, user.password))) return fail();
    if (has2fa) {
      // The password was right, so it's safe to say a code is needed.
      if (!totpCode) throw new SignInError("2FA code required. Please check your Authenticator app.");
      if (!codeIsValid()) {
        await fail();
        throw new SignInError("Invalid 2FA code. Please try again.");
      }
    }
  } else {
    // Authenticator-only account: the code is the credential.
    if (!has2fa || !codeIsValid()) return fail();
  }

  if (user.failedLoginCount > 0 || user.lockedUntil || acceptedStep != null) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, ...(acceptedStep != null ? { lastTotpStep: acceptedStep } : {}) },
    });
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
