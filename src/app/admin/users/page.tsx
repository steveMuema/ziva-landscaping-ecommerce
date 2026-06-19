"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
    UserCircleIcon,
    ShieldCheckIcon,
    TrashIcon,
    ArrowPathIcon,
    ChevronUpDownIcon,
} from "@heroicons/react/24/outline";

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

    const fetchUsers = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/users");
            if (!res.ok) throw new Error("Failed to load users");
            setUsers(await res.json());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const toggleRole = async (user: User) => {
        const newRole = user.role === "admin" ? "user" : "admin";
        if (!confirm(`Change ${user.email} to "${newRole}"?`)) return;
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
        } catch (e: any) {
            setError(e.message);
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
        } catch (e: any) {
            setError(e.message);
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
                    <p className="mt-1 text-sm text-[var(--muted)]">View and manage all registered accounts.</p>
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

            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-sm text-[var(--muted)]">
                        <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                        Loading users…
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-[var(--muted)]">
                        <UserCircleIcon className="h-10 w-10 mb-2 opacity-40" />
                        <p className="text-sm">No users found.</p>
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
                                {users.map((user) => (
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
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                user.role === "admin"
                                                    ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                            }`}>
                                                {user.role === "admin" && <ShieldCheckIcon className="h-3 w-3" />}
                                                {user.role}
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
                                                <button
                                                    onClick={() => toggleRole(user)}
                                                    disabled={busyId === user.id || isSelf(user.id)}
                                                    title={isSelf(user.id) ? "Cannot change your own role" : `Switch to ${user.role === "admin" ? "user" : "admin"}`}
                                                    className="flex items-center gap-1.5 rounded-md border border-[var(--card-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <ChevronUpDownIcon className="h-3.5 w-3.5" />
                                                    {user.role === "admin" ? "Demote" : "Promote"}
                                                </button>
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
                    {users.length} user{users.length !== 1 ? "s" : ""} total
                </div>
            </div>
        </div>
    );
}
