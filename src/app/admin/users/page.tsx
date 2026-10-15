"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowPathIcon,
    LockClosedIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    PlusIcon,
    ShieldCheckIcon,
    TrashIcon,
    UserCircleIcon,
    XMarkIcon,
    ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ROLES, ROLE_LABELS, canReceiveSuperadmin, type Role } from "@/lib/roles";

type User = {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    hasPassword: boolean;
    twoFactorEnabled: boolean;
    locked: boolean;
    createdAt: string;
};
type Me = { id: string; role: string; manageableRoles: Role[] };

const MIN_PASSWORD = 12;

const ROLE_BADGE: Record<string, string> = {
    superadmin: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    admin: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    editor: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    user: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const inputClass =
    "mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60";
const labelClass = "block text-sm font-medium text-[var(--foreground)]";
const primaryBtn =
    "rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50";
const secondaryBtn =
    "rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted-bg)] disabled:opacity-50";

function roleLabel(role: string) {
    return ROLE_LABELS[role as Role] ?? role;
}

function signInLabel(u: User) {
    if (!u.hasPassword && u.twoFactorEnabled) return "Authenticator only";
    if (u.hasPassword && u.twoFactorEnabled) return "Password + 2FA";
    if (u.hasPassword) return "Password";
    return "No sign-in set";
}

/** A strong random password that's still easy to read out (no look-alike characters). */
function generatePassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const bytes = crypto.getRandomValues(new Uint32Array(16));
    const raw = Array.from(bytes, (n) => chars[n % chars.length]).join("");
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12)}`;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data as T;
}

// ── Password field with show/generate ───────────────────────────────────────

function PasswordFields({
    value,
    onChange,
    confirm,
    onConfirmChange,
    idPrefix,
}: {
    value: string;
    onChange: (v: string) => void;
    confirm: string;
    onConfirmChange: (v: string) => void;
    idPrefix: string;
}) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="space-y-2">
            <div>
                <div className="flex items-center justify-between">
                    <label htmlFor={`${idPrefix}-pw`} className={labelClass}>Password</label>
                    <div className="flex gap-3 text-xs">
                        <button
                            type="button"
                            className="font-medium text-emerald-700 hover:underline"
                            onClick={() => {
                                const pw = generatePassword();
                                onChange(pw);
                                onConfirmChange(pw);
                                setVisible(true);
                            }}
                        >
                            Generate
                        </button>
                        <button type="button" className="text-[var(--muted)] hover:underline" onClick={() => setVisible((v) => !v)}>
                            {visible ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>
                <input
                    id={`${idPrefix}-pw`}
                    type={visible ? "text" : "password"}
                    autoComplete="new-password"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`${inputClass} font-mono`}
                />
            </div>
            <div>
                <label htmlFor={`${idPrefix}-pw2`} className={labelClass}>Repeat password</label>
                <input
                    id={`${idPrefix}-pw2`}
                    type={visible ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => onConfirmChange(e.target.value)}
                    className={`${inputClass} font-mono`}
                />
            </div>
            <p className="text-xs text-[var(--muted)]">
                At least {MIN_PASSWORD} characters. Share it with them privately; they can change it under My account.
            </p>
        </div>
    );
}

function passwordProblem(pw: string, confirm: string): string | null {
    if (pw.length < MIN_PASSWORD) return `Passwords need at least ${MIN_PASSWORD} characters.`;
    if (pw !== confirm) return "The passwords don't match.";
    return null;
}

// ── Dialog shell ────────────────────────────────────────────────────────────

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);
    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center" onMouseDown={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="w-full max-w-lg rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--foreground)] shadow-xl"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-[var(--card-border)] px-5 py-3">
                    <h2 className="font-semibold">{title}</h2>
                    <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-[var(--muted)] hover:bg-[var(--muted-bg)]">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="space-y-5 p-5">{children}</div>
            </div>
        </div>
    );
}

function Notice({ kind, text }: { kind: "error" | "success"; text: string }) {
    return (
        <p
            role={kind === "error" ? "alert" : "status"}
            className={`rounded-lg border px-3 py-2 text-sm ${kind === "error" ? "border-rose-500/30 bg-rose-500/10 text-rose-600" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"}`}
        >
            {text}
        </p>
    );
}

// ── Add user ────────────────────────────────────────────────────────────────

function AddUserDialog({ me, onClose, onCreated }: { me: Me; onClose: () => void; onCreated: (u: User) => void }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<Role>(me.manageableRoles.includes("editor") ? "editor" : me.manageableRoles[0]);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const problem = passwordProblem(password, confirm);
        if (problem) return setError(problem);
        setBusy(true);
        setError(null);
        try {
            const user = await api<User>("/api/admin/users", {
                method: "POST",
                body: JSON.stringify({ name, email, role, password }),
            });
            onCreated(user);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create the user.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog title="Add user" onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                {error && <Notice kind="error" text={error} />}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="new-name" className={labelClass}>Name</label>
                        <input id="new-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoFocus />
                    </div>
                    <div>
                        <label htmlFor="new-role" className={labelClass}>Role</label>
                        <select id="new-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputClass}>
                            {me.manageableRoles.map((r) => (
                                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="new-email" className={labelClass}>Email (used to sign in)</label>
                    <input id="new-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </div>
                <PasswordFields idPrefix="new" value={password} onChange={setPassword} confirm={confirm} onConfirmChange={setConfirm} />
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className={secondaryBtn}>Cancel</button>
                    <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Creating…" : "Create user"}</button>
                </div>
            </form>
        </Dialog>
    );
}

// ── Edit user ───────────────────────────────────────────────────────────────

function EditUserDialog({
    me,
    user,
    onClose,
    onSaved,
}: {
    me: Me;
    user: User;
    onClose: () => void;
    onSaved: (u: User) => void;
}) {
    const [current, setCurrent] = useState(user);
    const [name, setName] = useState(user.name ?? "");
    const [email, setEmail] = useState(user.email ?? "");
    const [role, setRole] = useState(user.role);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const [confirmAction, setConfirmAction] = useState<null | "disable2fa">(null);

    // Roles this admin can assign; keep the current one listed so the select shows it.
    const roleOptions = useMemo(
        () => ROLES.filter((r) => me.manageableRoles.includes(r) || r === current.role),
        [me.manageableRoles, current.role]
    );

    const patch = async (body: Record<string, unknown>, success: string) => {
        setBusy(true);
        setMessage(null);
        try {
            const updated = await api<User>(`/api/admin/users/${current.id}`, { method: "PATCH", body: JSON.stringify(body) });
            setCurrent(updated);
            onSaved(updated);
            setMessage({ kind: "success", text: success });
            return true;
        } catch (err) {
            setMessage({ kind: "error", text: err instanceof Error ? err.message : "Could not save." });
            return false;
        } finally {
            setBusy(false);
        }
    };

    const saveDetails = (e: React.FormEvent) => {
        e.preventDefault();
        patch({ name, email, ...(role !== current.role ? { role } : {}) }, "Details saved.");
    };

    const savePassword = async () => {
        const problem = passwordProblem(password, confirm);
        if (problem) return setMessage({ kind: "error", text: problem });
        const ok = await patch({ password }, "New password set. They've been signed out everywhere and must use it next time.");
        if (ok) {
            setPassword("");
            setConfirm("");
        }
    };

    return (
        <Dialog title={`Edit ${current.email ?? "user"}`} onClose={onClose}>
            {message && <Notice kind={message.kind} text={message.text} />}

            <form onSubmit={saveDetails} className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="edit-name" className={labelClass}>Name</label>
                        <input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="edit-role" className={labelClass}>Role</label>
                        <select id="edit-role" value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
                            {roleOptions.map((r) => (
                                <option key={r} value={r} disabled={!me.manageableRoles.includes(r)}>{ROLE_LABELS[r]}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="edit-email" className={labelClass}>Email (used to sign in)</label>
                    <input id="edit-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </div>
                <div className="flex justify-end">
                    <button type="submit" disabled={busy} className={primaryBtn}>Save details</button>
                </div>
            </form>

            <div className="space-y-4 border-t border-[var(--card-border)] pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Password &amp; security</h3>
                    <span className="text-xs text-[var(--muted)]">
                        Signs in with: <strong className="text-[var(--foreground)]">{signInLabel(current)}</strong>
                        {current.locked && <span className="ml-2 rounded bg-rose-500/10 px-1.5 py-0.5 font-semibold text-rose-600">Locked</span>}
                    </span>
                </div>

                <PasswordFields idPrefix="edit" value={password} onChange={setPassword} confirm={confirm} onConfirmChange={setConfirm} />
                <div className="flex justify-end">
                    <button type="button" disabled={busy || !password} onClick={savePassword} className={primaryBtn}>
                        {current.hasPassword ? "Set new password" : "Set password"}
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {current.locked && (
                        <button type="button" disabled={busy} className={secondaryBtn} onClick={() => patch({ unlock: true }, "Sign-in unlocked.")}>
                            Unlock sign-in
                        </button>
                    )}
                    {current.twoFactorEnabled && (
                        <button
                            type="button"
                            disabled={busy}
                            className={secondaryBtn}
                            onClick={() => setConfirmAction("disable2fa")}
                            title={current.hasPassword ? undefined : "Set a password first — this account has no password"}
                        >
                            Turn off 2FA
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={busy}
                        className={secondaryBtn}
                        onClick={() => patch({ signOutEverywhere: true }, "Signed out everywhere.")}
                    >
                        Sign out everywhere
                    </button>
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmAction === "disable2fa"}
                onClose={() => setConfirmAction(null)}
                onConfirm={() => {
                    setConfirmAction(null);
                    patch(
                        { disable2fa: true, ...(password ? { password } : {}) },
                        "2FA turned off. They can set it up again under My account → Two-factor authentication."
                    );
                }}
                title="Turn off 2FA"
                description={
                    current.hasPassword
                        ? "Use this if they've lost their authenticator. They'll sign in with their password only until they set 2FA up again."
                        : "This account has no password, so it needs one before 2FA can be turned off. Enter a new password above first."
                }
                confirmText="Turn off 2FA"
                cancelText="Cancel"
            />
        </Dialog>
    );
}


// ── Transfer super admin ────────────────────────────────────────────────────

function TransferDialog({
    self,
    candidates,
    onClose,
    onTransferred,
}: {
    self: User;
    candidates: User[];
    onClose: () => void;
    onTransferred: (email: string) => void;
}) {
    const [targetId, setTargetId] = useState(candidates[0]?.id ?? "");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const target = candidates.find((u) => u.id === targetId);
    const needsPassword = self.hasPassword;
    const needsCode = self.twoFactorEnabled;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!target) return setError("Choose who should become super admin.");
        if (needsPassword && !password) return setError("Enter your password to confirm.");
        if (needsCode && !/^\d{6}$/.test(code.replace(/\s+/g, ""))) return setError("Enter the 6-digit code from your authenticator app.");
        setBusy(true);
        setError(null);
        try {
            const res = await api<{ newSuperadmin: string }>("/api/admin/users/transfer-superadmin", {
                method: "POST",
                body: JSON.stringify({ targetId, password, totpCode: code.replace(/\s+/g, "") }),
            });
            onTransferred(res.newSuperadmin);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not transfer the role.");
            setCode("");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog title="Transfer super admin" onClose={onClose}>
            {candidates.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                    There&apos;s no other admin or editor to hand the role to yet. Add one first.
                </p>
            ) : (
                <form onSubmit={submit} className="space-y-4">
                    {error && <Notice kind="error" text={error} />}
                    <p className="text-sm text-[var(--muted)]">
                        There is only one super admin. The person you choose becomes super admin and you become a regular
                        admin straight away, so you&apos;ll no longer be able to manage other admins.
                    </p>
                    <div>
                        <label htmlFor="transfer-target" className={labelClass}>New super admin</label>
                        <select id="transfer-target" value={targetId} onChange={(e) => setTargetId(e.target.value)} className={inputClass}>
                            {candidates.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name ? `${u.name} (${u.email})` : u.email} · {roleLabel(u.role)}
                                </option>
                            ))}
                        </select>
                    </div>
                    {needsPassword && (
                        <div>
                            <label htmlFor="transfer-password" className={labelClass}>Your password</label>
                            <input id="transfer-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                        </div>
                    )}
                    {needsCode && (
                        <div>
                            <label htmlFor="transfer-code" className={labelClass}>Your authenticator code</label>
                            <input
                                id="transfer-code"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={7}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, ""))}
                                placeholder="123456"
                                className={`${inputClass} font-mono tracking-widest`}
                            />
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className={secondaryBtn}>Cancel</button>
                        <button type="submit" disabled={busy || !target} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
                            {busy ? "Transferring…" : target ? `Make ${target.email} super admin` : "Transfer"}
                        </button>
                    </div>
                </form>
            )}
        </Dialog>
    );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [me, setMe] = useState<Me | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [query, setQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<"" | Role>("");
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<User | null>(null);
    const [deleting, setDeleting] = useState<User | null>(null);
    const [transferring, setTransferring] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await api<{ users: User[]; me: Me }>("/api/admin/users");
            setUsers(data.users);
            setMe(data.me);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load users");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const visibleUsers = useMemo(() => {
        const q = query.trim().toLowerCase();
        return users.filter((u) =>
            (!roleFilter || u.role === roleFilter) &&
            (!q || (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q))
        );
    }, [users, query, roleFilter]);

    const canManage = (u: User) => Boolean(me && u.id !== me.id && me.manageableRoles.includes(u.role as Role));
    const replaceUser = (u: User) => setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));

    const confirmDelete = async () => {
        if (!deleting) return;
        const target = deleting;
        setDeleting(null);
        try {
            await api(`/api/admin/users/${target.id}`, { method: "DELETE" });
            setUsers((prev) => prev.filter((u) => u.id !== target.id));
            setNotice(`Deleted ${target.email}.`);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to delete user");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">User Management</h1>
                    <p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">
                        There is one super admin, who manages admins, editors and users and can hand the role to someone else.
                        Admins manage editors and users. Editors manage products, categories, the blog and site content, but not
                        orders, payments, users or settings.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchUsers}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] disabled:opacity-50"
                    >
                        <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    {me?.role === "superadmin" && (
                        <button
                            onClick={() => setTransferring(true)}
                            className="flex items-center gap-2 rounded-lg border border-amber-500/40 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                        >
                            <ArrowsRightLeftIcon className="h-4 w-4" />
                            Transfer super admin
                        </button>
                    )}
                    {me && me.manageableRoles.length > 0 && (
                        <button onClick={() => setAdding(true)} className={`${primaryBtn} flex items-center gap-2`}>
                            <PlusIcon className="h-4 w-4" />
                            Add user
                        </button>
                    )}
                </div>
            </div>

            {error && <Notice kind="error" text={error} />}
            {notice && <Notice kind="success" text={notice} />}

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px] flex-1">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search name or email"
                        aria-label="Search users"
                        className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as "" | Role)}
                    aria-label="Filter by role"
                    className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                    <option value="">All roles</option>
                    {ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm">
                {loading && users.length === 0 ? (
                    <div className="flex items-center justify-center py-16 text-sm text-[var(--muted)]">
                        <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
                        Loading users…
                    </div>
                ) : visibleUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-[var(--muted)]">
                        <UserCircleIcon className="mb-2 h-10 w-10 opacity-40" />
                        <p className="text-sm">{users.length === 0 ? "No users found." : "No users match this filter."}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--card-border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                                    <th className="px-5 py-3 text-left font-semibold">User</th>
                                    <th className="px-5 py-3 text-left font-semibold">Role</th>
                                    <th className="px-5 py-3 text-left font-semibold">Signs in with</th>
                                    <th className="px-5 py-3 text-left font-semibold">Joined</th>
                                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--card-border)]">
                                {visibleUsers.map((user) => {
                                    const isSelf = user.id === me?.id;
                                    const manageable = canManage(user);
                                    return (
                                        <tr key={user.id} className="transition-colors hover:bg-[var(--muted-bg)]">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-xs font-semibold uppercase text-[var(--accent)]">
                                                        {(user.name ?? user.email ?? "?")[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-[var(--foreground)]">
                                                            {user.name ?? <span className="italic text-[var(--muted)]">No name</span>}
                                                            {isSelf && (
                                                                <span className="ml-2 rounded bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--accent)]">You</span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-[var(--muted)]">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[user.role] ?? ROLE_BADGE.user}`}>
                                                    {(user.role === "admin" || user.role === "superadmin") && <ShieldCheckIcon className="h-3 w-3" />}
                                                    {roleLabel(user.role)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-[var(--muted)]">
                                                {signInLabel(user)}
                                                {user.locked && (
                                                    <span className="ml-2 inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 font-semibold text-rose-600">
                                                        <LockClosedIcon className="h-3 w-3" />
                                                        Locked
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-[var(--muted)]">
                                                {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isSelf ? (
                                                        <Link
                                                            href="/admin/account"
                                                            className="flex items-center gap-1.5 rounded-md border border-[var(--card-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
                                                        >
                                                            <UserCircleIcon className="h-3.5 w-3.5" />
                                                            My account
                                                        </Link>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => setEditing(user)}
                                                                disabled={!manageable}
                                                                title={manageable ? "Edit user" : user.role === "superadmin" ? "Only the super admin can change their own account" : `Only the super admin can edit ${roleLabel(user.role)} accounts`}
                                                                className="flex items-center gap-1.5 rounded-md border border-[var(--card-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40"
                                                            >
                                                                <PencilSquareIcon className="h-3.5 w-3.5" />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleting(user)}
                                                                disabled={!manageable}
                                                                title={manageable ? "Delete user" : user.role === "superadmin" ? "The super admin can't be deleted" : `Only the super admin can delete ${roleLabel(user.role)} accounts`}
                                                                className="flex items-center gap-1.5 rounded-md border border-rose-500/30 px-2.5 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                                                            >
                                                                <TrashIcon className="h-3.5 w-3.5" />
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="border-t border-[var(--card-border)] px-5 py-3 text-xs text-[var(--muted)]">
                    {visibleUsers.length === users.length
                        ? `${users.length} user${users.length !== 1 ? "s" : ""} total`
                        : `${visibleUsers.length} of ${users.length} users`}
                </div>
            </div>

            {adding && me && (
                <AddUserDialog
                    me={me}
                    onClose={() => setAdding(false)}
                    onCreated={(u) => {
                        setUsers((prev) => [u, ...prev]);
                        setAdding(false);
                        setNotice(`Created ${u.email}. Share their password with them privately.`);
                    }}
                />
            )}
            {transferring && me && (
                <TransferDialog
                    self={users.find((u) => u.id === me.id)!}
                    candidates={users.filter((u) => u.id !== me.id && canReceiveSuperadmin(u.role))}
                    onClose={() => setTransferring(false)}
                    onTransferred={(email) => {
                        setTransferring(false);
                        setNotice(`${email} is now the super admin. You're now an admin.`);
                        fetchUsers();
                    }}
                />
            )}
            {editing && me && (
                <EditUserDialog me={me} user={editing} onClose={() => setEditing(null)} onSaved={replaceUser} />
            )}
            <ConfirmDialog
                isOpen={deleting != null}
                onClose={() => setDeleting(null)}
                onConfirm={confirmDelete}
                title="Delete user"
                description={`Permanently delete ${deleting?.email ?? "this user"}? This cannot be undone.`}
                confirmText="Yes, delete"
                cancelText="Cancel"
            />
        </div>
    );
}
