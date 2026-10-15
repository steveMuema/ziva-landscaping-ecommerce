import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { manageableRoles } from "@/lib/roles";
import { UserAdminError, createUser, toManagedUser } from "@/lib/user-admin";

/** All accounts plus what the signed-in admin may do (for enabling buttons in the UI). */
export async function GET() {
    const auth = await requireAdminApi();
    if ("response" in auth) return auth.response;

    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({
        users: users.map(toManagedUser),
        me: { id: auth.user.id, role: auth.user.role, manageableRoles: manageableRoles(auth.user.role) },
    });
}

export async function POST(request: NextRequest) {
    const auth = await requireAdminApi();
    if ("response" in auth) return auth.response;

    const body = await request.json().catch(() => ({}));
    try {
        const { user, audit: entry } = await createUser(auth.user, body);
        await audit(auth.user, { ...entry, entity: "User", entityId: user.id });
        return NextResponse.json(toManagedUser(user), { status: 201 });
    } catch (error) {
        if (error instanceof UserAdminError) return NextResponse.json({ error: error.message }, { status: error.status });
        throw error;
    }
}
