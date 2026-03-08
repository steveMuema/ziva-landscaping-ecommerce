"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const EARTH_FACTS = [
    "Earth is the only planet not named after a god. Humble flex.",
    "A day on Venus is longer than a year on Venus. We also felt that.",
    "There are more trees on Earth than stars in the Milky Way. So plant more — Ziva approves.",
    "The Amazon rainforest produces 20% of the world's oxygen. Your lawn does its part too.",
    "Lightning strikes Earth about 100 times per second. Statistically, not our fault.",
    "Oceans cover 71% of Earth. The other 29% needs landscaping.",
    "Earth's core is as hot as the surface of the Sun. Our servers feel the same right now.",
    "A million Earths could fit inside the Sun. Still no excuse for our server to give up.",
    "Earth travels around the Sun at 107,000 km/h. And yet our database couldn't keep up.",
    "Honey never spoils — archaeologists found 3,000-year-old edible honey. Our code is newer.",
];

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [fact, setFact] = useState("");

    useEffect(() => {
        setFact(EARTH_FACTS[Math.floor(Math.random() * EARTH_FACTS.length)]);
        console.error(error);
    }, [error]);

    const isDbOverload =
        error?.message?.toLowerCase().includes("too many") ||
        error?.message?.toLowerCase().includes("connection") ||
        error?.message?.toLowerCase().includes("p2037");

    return (
        <html lang="en">
            <head>
                <style>{`
          @keyframes bobble {
            0% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-8px) rotate(-5deg); }
            50% { transform: translateY(0) rotate(0deg); }
            75% { transform: translateY(-8px) rotate(5deg); }
            100% { transform: translateY(0) rotate(0deg); }
          }
          .bot-animation {
            display: inline-block;
            animation: bobble 3s infinite ease-in-out;
            font-size: 64px;
            margin-bottom: 8px;
          }
        `}</style>
            </head>
            <body
                style={{
                    margin: 0,
                    fontFamily: "system-ui, sans-serif",
                    background: "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    padding: "1rem",
                }}
            >
                <div
                    style={{
                        maxWidth: 520,
                        width: "100%",
                        background: "#fff",
                        borderRadius: 20,
                        boxShadow: "0 4px 32px rgba(22,101,52,0.10)",
                        padding: "2.5rem 2rem",
                        textAlign: "center",
                    }}
                >
                    <div className="bot-animation">🤖</div>
                    <h1
                        style={{
                            fontSize: "1.5rem",
                            fontWeight: 700,
                            color: "#166534",
                            marginBottom: 8,
                        }}
                    >
                        {isDbOverload
                            ? "Beep boop — our servers are sweating!"
                            : "Bzzzt... Something went sideways"}
                    </h1>
                    <p style={{ color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>
                        {isDbOverload
                            ? "We're handling more visitors than usual. Give my circuits a second — I'll sort it out."
                            : "I encountered a rogue bug in my wires. My human creators have been alerted!"}
                    </p>

                    {fact && (
                        <div
                            style={{
                                background: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                borderRadius: 12,
                                padding: "0.85rem 1rem",
                                marginBottom: 24,
                                fontSize: "0.875rem",
                                color: "#166534",
                                lineHeight: 1.55,
                            }}
                        >
                            🌍 <strong>Earth fact while I reboot:</strong> {fact}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        <button
                            onClick={reset}
                            style={{
                                background: "#166534",
                                color: "#fff",
                                border: "none",
                                borderRadius: 10,
                                padding: "0.65rem 1.5rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontSize: "0.95rem",
                            }}
                        >
                            Try again 🔄
                        </button>
                        <Link
                            href="/"
                            style={{
                                background: "#f3f4f6",
                                color: "#374151",
                                borderRadius: 10,
                                padding: "0.65rem 1.5rem",
                                fontWeight: 600,
                                textDecoration: "none",
                                fontSize: "0.95rem",
                                display: "inline-block",
                            }}
                        >
                            Take me home 🏡
                        </Link>
                    </div>

                    {error?.digest && (
                        <p style={{ marginTop: 24, fontSize: "0.72rem", color: "#9ca3af" }}>
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>
            </body>
        </html>
    );
}
