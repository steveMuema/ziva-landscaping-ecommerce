"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { getProviders, signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function SignInForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [hasGoogle, setHasGoogle] = useState(false);
  // "authenticator" = this account signs in with an authenticator code only (no password).
  const [method, setMethod] = useState<"password" | "authenticator">("password");
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // The last code sent automatically, so the same code is never submitted twice.
  const lastAutoCode = useRef("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // The admin rejected this session (account deleted or no longer staff): clear the
    // stale cookie rather than redirecting back to /admin, which would loop forever.
    if (searchParams.get("error") === "SessionExpired") {
      signOut({ redirect: false });
      return;
    }
    const checkSession = async () => {
      const session = await fetch("/api/auth/session").then((res) => res.json());
      if (session?.user) router.push("/admin");
    };
    checkSession();
  }, [router, searchParams]);

  useEffect(() => {
    getProviders().then((p) => setHasGoogle(Boolean(p?.google)));
  }, []);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "CredentialsSignin") {
      setError("Invalid email or password.");
    } else if (err === "Callback" || err === "AccessDenied") {
      setError("Only admin users are allowed to sign in.");
    } else if (err === "SessionExpired") {
      setError("Your session is no longer valid. Please sign in again.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!email.trim() || !email.includes("@")) {
        setError("Please enter a valid email address.");
        return;
      }
      setError("");
      setChecking(true);
      try {
        const res = await fetch("/api/signin-method", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          setError(data.error || "Too many requests. Please wait a minute.");
          return;
        }
        setMethod(data.method === "authenticator" ? "authenticator" : "password");
      } catch {
        setMethod("password");
      } finally {
        setChecking(false);
      }
      setPassword("");
      setTotpCode("");
      setStep(2);
      return;
    }

    await submitCredentials(totpCode);
  };

  const submitCredentials = async (code: string) => {
    if (submitting) return;
    if (method === "authenticator") {
      if (!/^\d{6}$/.test(code)) {
        setError("Enter the 6-digit code from your authenticator app.");
        return;
      }
    } else if (!password) {
      setError("Enter your password.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password: method === "authenticator" ? "" : password,
        totpCode: code,
        redirect: false,
      });
      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError(method === "authenticator" ? "That code didn't work. Wait for a new code and try again." : "Invalid email or password.");
        } else {
          setError(result.error);
        }
        // Clear a rejected code so the next one can be typed (and sent) straight away.
        if (code) setTotpCode("");
      } else if (result?.ok) {
        router.push("/admin");
        return; // keep the form disabled while navigating
      }
    } finally {
      setSubmitting(false);
    }
  };

  /** Keep digits only; send automatically once all 6 are in (typed or pasted). */
  const onCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setTotpCode(digits);
    const ready = method === "authenticator" || password.length > 0;
    if (digits.length === 6 && ready && !submitting && digits !== lastAutoCode.current) {
      lastAutoCode.current = digits;
      submitCredentials(digits);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] p-6 rounded-lg shadow-md border border-[var(--card-border)]">
          <h2 className="text-2xl font-bold mb-4 text-[var(--foreground)]">Sign in</h2>
          {error && (
            <p className="mb-4 p-2 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded" role="alert">
              {error}
            </p>
          )}
          {step === 1 ? (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full p-2 border border-[var(--card-border)] rounded-md text-[var(--foreground)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--accent)]"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={checking}
                className="w-full bg-[var(--accent)] text-white p-2.5 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {checking ? "Checking…" : "Continue"}
              </button>
              {hasGoogle && (
                <>
                  <p className="my-4 text-center text-sm font-medium text-[var(--foreground)]/50">OR</p>
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/admin" })}
                    className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-[var(--card-border)] p-2.5 rounded-md font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-3 transition-colors shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Continue with Google
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="mb-5 flex items-center justify-between bg-[var(--foreground)]/5 p-3 rounded-lg border border-[var(--card-border)]">
                <span className="text-sm font-medium text-[var(--foreground)] truncate opacity-90">{email}</span>
                <button type="button" onClick={() => setStep(1)} className="text-sm text-[var(--accent)] hover:underline font-semibold shrink-0 ml-4">
                  Edit
                </button>
              </div>

              {method === "authenticator" ? (
                <div className="mb-5">
                  <label htmlFor="signin-totp" className="block text-sm font-medium text-[var(--foreground)]">
                    Authenticator code
                  </label>
                  <input
                    id="signin-totp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9 ]*"
                    value={totpCode}
                    onChange={(e) => onCodeChange(e.target.value)}
                    readOnly={submitting}
                    className="mt-1 block w-full p-2.5 border border-[var(--card-border)] rounded-md text-center text-lg text-[var(--foreground)] bg-[var(--background)] tracking-[0.4em] font-mono focus:ring-2 focus:ring-[var(--accent)]"
                    placeholder="123456"
                    maxLength={7}
                    autoComplete="one-time-code"
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-[var(--muted)]">Open your authenticator app and enter the 6-digit code for Ziva Landscaping. You&apos;ll be signed in as soon as all 6 digits are in.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label htmlFor="signin-password" className="block text-sm font-medium text-[var(--foreground)]">Password</label>
                    <input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full p-2 border border-[var(--card-border)] rounded-md text-[var(--foreground)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--accent)]"
                      autoComplete="current-password"
                      autoFocus
                    />
                  </div>

                  <div className="mb-5">
                    <label htmlFor="signin-totp" className="block text-sm font-medium text-[var(--foreground)]">
                      Authenticator code <span className="font-normal text-[var(--muted)]">(if 2FA is on)</span>
                    </label>
                    <input
                      id="signin-totp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9 ]*"
                      value={totpCode}
                      onChange={(e) => onCodeChange(e.target.value)}
                    readOnly={submitting}
                      className="mt-1 block w-full p-2 border border-[var(--card-border)] rounded-md text-[var(--foreground)] bg-[var(--background)] tracking-widest font-mono focus:ring-2 focus:ring-[var(--accent)]"
                      placeholder="123456"
                      maxLength={7}
                      autoComplete="one-time-code"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[var(--accent)] text-white p-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {submitting ? "Signing in…" : "Secure Sign In"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--card-bg)] p-6 rounded-lg shadow-md animate-pulse h-64 border border-[var(--card-border)]" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}