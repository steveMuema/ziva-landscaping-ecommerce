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
      setError("Invalid email or password. Check the default credentials below if this is local dev.");
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Admin Sign In</h2>
          {error && (
            <p className="mb-4 p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded" role="alert">
              {error}
            </p>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-gray-900"
              required
              autoComplete="email"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-gray-900"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>
        {process.env.NODE_ENV === "development" && (
          <p className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded">
            <strong>Default dev credentials</strong> (from seed):<br />
            Email: <code className="bg-amber-100 px-1 rounded">admin@zivalandscaping.co.ke</code><br />
            Password: <code className="bg-amber-100 px-1 rounded">securepassword123</code><br />
            Run <code className="bg-amber-100 px-1 rounded">npx prisma db seed</code> if you haven’t.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md animate-pulse h-64" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}