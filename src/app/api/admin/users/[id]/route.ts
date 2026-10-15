import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { UserAdminError, deleteUser, toManagedUser, updateUser } from "@/lib/user-admin";

type Params = { params: Promise<{ id: string }> };

function errorResponse(error: unknown) {
    if (error instanceof UserAdminError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
}

/** Edit details, role, password, 2FA, lockout or sessions (see updateUser for the rules). */
export async function PATCH(request: NextRequest, { params }: Params) {
    const auth = await requireAdminApi();
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    try {
        const { user, audit: entry } = await updateUser(auth.user, id, body);
        if (entry) await audit(auth.user, { ...entry, entity: "User", entityId: id });
        return NextResponse.json(toManagedUser(user));
    } catch (error) {
        return errorResponse(error);
    }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
    const auth = await requireAdminApi();
    if ("response" in auth) return auth.response;

    const { id } = await params;
    try {
        const { audit: entry } = await deleteUser(auth.user, id);
        await audit(auth.user, { ...entry, entity: "User", entityId: id });
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}
