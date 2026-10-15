import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { ROLE_LABELS, isRole } from "@/lib/roles";

const USER_SELECT = { id: true, name: true, email: true, role: true, twoFactorEnabled: true, createdAt: true } as const;

async function isLastAdmin(id: string): Promise<boolean> {
    const admins = await prisma.user.count({ where: { role: "admin", NOT: { id } } });
    return admins === 0;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdminApi();
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { role } = body as { role?: unknown };

    if (!isRole(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Prevent the acting admin from demoting themselves
    if (id === auth.user.id && role !== "admin") {
        return NextResponse.json({ error: "You cannot demote your own account." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id }, select: { role: true, email: true } });
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (existing.role === "admin" && role !== "admin" && (await isLastAdmin(id))) {
        return NextResponse.json({ error: "There must be at least one admin." }, { status: 400 });
    }

    const updated = await prisma.user.update({ where: { id }, data: { role }, select: USER_SELECT });

    if (existing.role !== role) {
        await audit(auth.user, {
            action: "user.role",
            entity: "User",
            entityId: id,
            summary: `Changed ${existing.email ?? id} from ${ROLE_LABELS[isRole(existing.role) ? existing.role : "user"]} to ${ROLE_LABELS[role]}`,
            changes: { role: { from: existing.role, to: role } },
        });
    }

    return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdminApi();
    if ("response" in auth) return auth.response;

    const { id } = await params;

    if (id === auth.user.id) {
        return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id }, select: { role: true, email: true } });
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (existing.role === "admin" && (await isLastAdmin(id))) {
        return NextResponse.json({ error: "There must be at least one admin." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    await audit(auth.user, {
        action: "user.delete",
        entity: "User",
        entityId: id,
        summary: `Deleted user ${existing.email ?? id} (${existing.role})`,
    });
    return NextResponse.json({ success: true });
}
