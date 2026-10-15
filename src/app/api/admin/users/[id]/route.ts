import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdminApi();
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const body = await req.json();
    const { role } = body;

    if (!["admin", "user"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Prevent the acting admin from demoting themselves
    if (id === auth.user.id && role !== "admin") {
        return NextResponse.json({ error: "You cannot demote your own account." }, { status: 400 });
    }

    const updated = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, name: true, email: true, role: true, twoFactorEnabled: true, createdAt: true },
    });

    return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdminApi();
    if ("response" in auth) return auth.response;

    const { id } = await params;

    if (id === auth.user.id) {
        return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
