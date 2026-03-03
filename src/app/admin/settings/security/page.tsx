"use client";

import { useState } from "react";
import { ShieldCheckIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function SecuritySettingsPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Setup State
    const [step, setStep] = useState<"idle" | "setup" | "enabled">("idle");
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [secret, setSecret] = useState("");
    const [token, setToken] = useState("");

    const handleGenerate = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/settings/2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "generate" }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to generate 2FA");

            setSecret(data.secret);
            setQrCodeUrl(data.qrCodeUrl);
            setStep("setup");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (token.length !== 6) {
            setError("Please enter a valid 6-digit code.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/settings/2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "verify", secret, token }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Verification failed");

            setSuccess("Two-Factor Authentication has been successfully enabled!");
            setStep("enabled");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        if (!confirm("Are you critically sure you want to disable 2FA? Your admin account will be highly vulnerable to credential stuffing attacks.")) return;

        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/settings/2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "disable" }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to disable 2FA");

            setSuccess("Two-Factor Authentication has been disabled.");
            setStep("idle");
            setQrCodeUrl("");
            setSecret("");
            setToken("");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Security Settings</h1>
                <p className="text-sm text-[var(--muted)] mt-1">Manage physical hardware Two-Factor Authentication (2FA) for your Admin profile.</p>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`p-3 rounded-full ${step === 'enabled' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {step === 'enabled' ? <ShieldCheckIcon className="w-8 h-8" /> : <ShieldExclamationIcon className="w-8 h-8" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--foreground)]">Authenticator App (TOTP)</h2>
                            <p className="text-sm text-[var(--muted)]">
                                Protect your highly privileged admin loop using Google Authenticator, Authy, or Apple Passwords.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 border border-rose-500/30 bg-rose-500/10 text-rose-500 text-sm rounded-lg font-medium">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-4 border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-sm rounded-lg font-medium">
                            {success}
                        </div>
                    )}

                    {step === "idle" && (
                        <div className="mt-8 border-t border-[var(--card-border)] pt-6">
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="bg-[var(--foreground)] text-[var(--background)] px-6 py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {loading ? "Generating Cryptography..." : "Set up 2FA Authenticator"}
                            </button>
                        </div>
                    )}

                    {step === "setup" && (
                        <div className="mt-8 border-t border-[var(--card-border)] pt-6 space-y-6">
                            <div>
                                <h3 className="text-md font-medium text-[var(--foreground)] mb-2">1. Scan the QR Code</h3>
                                <p className="text-sm text-[var(--muted)] mb-4">Open your Authenticator app and scan the mathematical barcode below:</p>
                                <div className="bg-white p-4 inline-block rounded-xl border border-gray-200">
                                    {qrCodeUrl && <Image src={qrCodeUrl} alt="2FA QR Code" width={200} height={200} className="w-48 h-48" />}
                                </div>
                                <p className="text-xs text-[var(--muted)] mt-3">Manual string: <code className="bg-[var(--muted-bg)] px-2 py-1 rounded font-mono text-[var(--accent)]">{secret}</code></p>
                            </div>

                            <div>
                                <h3 className="text-md font-medium text-[var(--foreground)] mb-2">2. Verify the 6-Digit Code</h3>
                                <p className="text-sm text-[var(--muted)] mb-3">To cryptographically bind your device, enter the pin generated by your app.</p>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={token}
                                        onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                                        placeholder="123456"
                                        className="w-32 px-4 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] font-mono tracking-widest text-center"
                                    />
                                    <button
                                        onClick={handleVerify}
                                        disabled={loading || token.length !== 6}
                                        className="bg-[var(--accent)] text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                                    >
                                        {loading ? "Verifying..." : "Verify & Enable"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "enabled" && (
                        <div className="mt-8 border-t border-[var(--card-border)] pt-6">
                            <p className="text-sm text-[var(--muted)] mb-4">
                                Your Admin Account is strictly guarded by hardware-level Two-Factor Authentication.
                            </p>
                            <button
                                onClick={handleDisable}
                                disabled={loading}
                                className="bg-rose-500 text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
                            >
                                {loading ? "Unbinding..." : "Disable 2FA Security"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
