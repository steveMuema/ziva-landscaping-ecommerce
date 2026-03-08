"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    const isDbOverload =
        error?.message?.toLowerCase().includes("too many") ||
        error?.message?.toLowerCase().includes("connection") ||
        error?.message?.toLowerCase().includes("p2037");

    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    fontFamily: "system-ui, sans-serif",
                    background: "#f9fafb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    padding: "1rem",
                }}
            >
                <div
                    style={{
                        maxWidth: 480,
                        width: "100%",
                        background: "#fff",
                        borderRadius: 16,
                        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                        padding: "2.5rem 2rem",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: 56, marginBottom: 16 }}>
                        {isDbOverload ? "🌿" : "⚠️"}
                    </div>
                    <h1
                        style={{
                            fontSize: "1.5rem",
                            fontWeight: 700,
                            color: "#166534",
                            marginBottom: 8,
                        }}
                    >
                        {isDbOverload ? "We're a bit busy right now" : "Something went wrong"}
                    </h1>
                    <p style={{ color: "#6b7280", marginBottom: 24, lineHeight: 1.6 }}>
                        {isDbOverload
                            ? "Our servers are handling a lot of visitors at the moment. This is temporary — please try again in a few seconds."
                            : "An unexpected error occurred. Our team has been notified."}
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        <button
                            onClick={reset}
                            style={{
                                background: "#166534",
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                padding: "0.65rem 1.5rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontSize: "0.95rem",
                            }}
                        >
                            Try again
                        </button>
                        <Link
                            href="/"
                            style={{
                                background: "#f3f4f6",
                                color: "#374151",
                                border: "none",
                                borderRadius: 8,
                                padding: "0.65rem 1.5rem",
                                fontWeight: 600,
                                textDecoration: "none",
                                fontSize: "0.95rem",
                                display: "inline-block",
                            }}
                        >
                            Go home
                        </Link>
                    </div>
                    {error?.digest && (
                        <p style={{ marginTop: 24, fontSize: "0.75rem", color: "#9ca3af" }}>
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>
            </body>
        </html>
    );
}
