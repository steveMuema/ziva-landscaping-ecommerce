"use client";
import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
    const err = searchParams.get("error");
    if (err === "CredentialsSignin") {
      setError("Invalid email or password.");
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