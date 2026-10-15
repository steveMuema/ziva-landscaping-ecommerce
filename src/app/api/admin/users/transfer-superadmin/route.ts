import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { UserAdminError, transferSuperadmin } from "@/lib/user-admin";

/** The super admin hands the role to another staff member (see transferSuperadmin). */
export async function POST(request: NextRequest) {
    const auth = await requireAdminApi();
    if ("response" in auth) return auth.response;

    const body = await request.json().catch(() => ({}));
    try {
        const { target, audit: entry } = await transferSuperadmin(auth.user, body);
        await audit(auth.user, { ...entry, entity: "User", entityId: target.id });
        return NextResponse.json({ success: true, newSuperadmin: target.email });
    } catch (error) {
        if (error instanceof UserAdminError) return NextResponse.json({ error: error.message }, { status: error.status });
        throw error;
    }
}
