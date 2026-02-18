"use client";
import { Suspense, useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [hasGoogle, setHasGoogle] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkSession = async () => {
      const session = await fetch("/api/auth/session").then((res) => res.json());
      if (session?.user) router.push("/admin");
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    getProviders().then((p) => setHasGoogle(Boolean(p?.google)));
  }, []);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "CredentialsSignin") {
      setError("Invalid email or password.");
    } else if (err === "Callback" || err === "AccessDenied") {
      setError("Only admin users are allowed to sign in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      callbackUrl: "/admin",
    });
    if (result?.error) {
      setError("Invalid email or password.");
    } else if (result?.ok && result.url) {
      router.push(result.url);
    } else if (result?.ok) {
      router.push("/admin");
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full p-2 border border-[var(--card-border)] rounded-md text-[var(--foreground)] bg-[var(--background)]"
              required
              autoComplete="email"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-2 border border-[var(--card-border)] rounded-md text-[var(--foreground)] bg-[var(--background)]"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[var(--accent)] text-white p-2 rounded-md hover:opacity-90"
          >
            Sign In
          </button>
          {hasGoogle && (
            <>
              <p className="my-3 text-center text-sm text-[var(--foreground)]/70">or</p>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/admin" })}
                className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-[var(--card-border)] p-2 rounded-md hover:opacity-90 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign in with Google
              </button>
            </>
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