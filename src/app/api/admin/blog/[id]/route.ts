import { NextRequest, NextResponse } from "next/server";
import { requireEditorApi } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireEditorApi();
        if ("response" in auth) return auth.response;

        const { id } = await params;

        const postId = parseInt(id, 10);
        if (isNaN(postId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
        const post = await prisma.blogPost.delete({ where: { id: postId }, select: { title: true } });
        await audit(auth.user, { action: "blog.delete", entity: "BlogPost", entityId: postId, summary: `Deleted post “${post.title}”` });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting blog post:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
