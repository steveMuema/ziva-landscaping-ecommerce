import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (authHeader !== "Bearer ziva-super-secret-token-1234") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("Deleting existing test blog posts...");
        await prisma.blogPost.deleteMany({});
        console.log("Deleted all blog posts.");

        return NextResponse.json({ success: true, message: "All blogs deleted successfully from production." });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete blogs" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
