"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
    UserCircleIcon,
    ShieldCheckIcon,
    TrashIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/roles";

const ROLE_BADGE: Record<string, string> = {
    admin: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    editor: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    user: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

type User = {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    twoFactorEnabled: boolean;
    createdAt: string;
};

export default function UsersPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<"" | Role>("");

    const visibleUsers = useMemo(() => {
        const q = query.trim().toLowerCase();
        return users.filter((u) =>
            (!roleFilter || u.role === roleFilter) &&
            (!q || (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q))
        );
    }, [users, query, roleFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/users");
            if (!res.ok) throw new Error("Failed to load users");
            setUsers(await res.json());
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const changeRole = async (user: User, newRole: Role) => {
        if (newRole === user.role) return;
        if (!confirm(`Change ${user.email} to "${ROLE_LABELS[newRole]}"?`)) return;
        setBusyId(user.id);
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setUsers((prev) => prev.map((u) => (u.id === user.id ? data : u)));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update role");
        } finally {
            setBusyId(null);
        }
    };

    const deleteUser = async (user: User) => {
        if (!confirm(`Permanently delete ${user.email}? This cannot be undone.`)) return;
        setBusyId(user.id);
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to delete user");
        } finally {
            setBusyId(null);
        }
    };

    const isSelf = (id: string) => id === session?.user?.id;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">User Management</h1>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        Admins can do everything. Editors manage products, categories, the blog and site content, but not orders, payments, users or settings.
                    </p>
                </div>
                <button
                    onClick={fetchUsers}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted-bg)] disabled:opacity-50 transition-colors"
                >
                    <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-medium text-rose-500">
                    {error}
                </div>
            )}

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

            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-sm text-[var(--muted)]">
                        <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                        Loading users…
                    </div>
                ) : visibleUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-[var(--muted)]">
                        <UserCircleIcon className="h-10 w-10 mb-2 opacity-40" />
                        <p className="text-sm">{users.length === 0 ? "No users found." : "No users match this filter."}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--card-border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                                    <th className="px-5 py-3 text-left font-semibold">User</th>
                                    <th className="px-5 py-3 text-left font-semibold">Role</th>
                                    <th className="px-5 py-3 text-left font-semibold">2FA</th>
                                    <th className="px-5 py-3 text-left font-semibold">Joined</th>
                                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--card-border)]">
                                {visibleUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-[var(--muted-bg)] transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-semibold text-xs uppercase">
                                                    {(user.name ?? user.email ?? "?")[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[var(--foreground)]">
                                                        {user.name ?? <span className="italic text-[var(--muted)]">No name</span>}
                                                        {isSelf(user.id) && (
                                                            <span className="ml-2 rounded bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)] uppercase">You</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-[var(--muted)]">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[user.role] ?? ROLE_BADGE.user}`}>
                                                {user.role === "admin" && <ShieldCheckIcon className="h-3 w-3" />}
                                                {ROLE_LABELS[user.role as Role] ?? user.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {user.twoFactorEnabled ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                    <ShieldCheckIcon className="h-3 w-3" />
                                                    Enabled
                                                </span>
                                            ) : (
                                                <span className="text-xs text-[var(--muted)]">Off</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-[var(--muted)]">
                                            {new Date(user.createdAt).toLocaleDateString("en-GB", {
                                                day: "numeric", month: "short", year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-2">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => changeRole(user, e.target.value as Role)}
                                                    disabled={busyId === user.id || isSelf(user.id)}
                                                    title={isSelf(user.id) ? "Cannot change your own role" : "Change role"}
                                                    aria-label={`Role for ${user.email}`}
                                                    className="rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-2 py-1.5 text-xs font-medium text-[var(--foreground)] disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    {ROLES.map((r) => (
                                                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => deleteUser(user)}
                                                    disabled={busyId === user.id || isSelf(user.id)}
                                                    title={isSelf(user.id) ? "Cannot delete your own account" : "Delete user"}
                                                    className="flex items-center gap-1.5 rounded-md border border-rose-500/30 px-2.5 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <TrashIcon className="h-3.5 w-3.5" />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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
        </div>
    );
}
