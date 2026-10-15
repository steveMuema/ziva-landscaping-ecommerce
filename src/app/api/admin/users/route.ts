import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const auth = await requireAdminApi();
    if ("response" in auth) return auth.response;

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            twoFactorEnabled: true,
            createdAt: true,
        },
    });

    return NextResponse.json(users);
}
