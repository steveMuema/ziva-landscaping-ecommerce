import { redirect } from "next/navigation";
import Image from "next/image";
import prisma from "@/lib/prisma";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

export default async function BlogPreviewPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getServerSession(authOptions);

    // Must be an admin to view previews securely
    if (!session || session.user?.role !== "admin") {
        redirect("/auth/signin");
    }

    const { id } = await params;

    // Try finding by internal ID or slug (in case they haven't saved an ID yet)
    const post = await prisma.blogPost.findFirst({
        where: {
            OR: [
                { id: isNaN(parseInt(id, 10)) ? -1 : parseInt(id, 10) },
                { slug: id }
            ]
        }
    });

    if (!post) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-24 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Draft Not Found</h1>
                <p className="mt-4 text-lg text-slate-600">
                    This post hasn&apos;t been saved yet, or the ID is invalid. Save your changes in the editor first.
                </p>
            </div>
        );
    }

    return (
        <article className="mx-auto flex max-w-3xl flex-col px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8 rounded-lg bg-emerald-50 px-4 py-3 border border-emerald-200 text-center">
                <p className="text-sm font-medium text-emerald-800">
                    Viewing Preview ({post.published ? "Published" : "Draft"})
                </p>
            </div>
            <header className="mb-10 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    {post.title}
                </h1>
                {post.excerpt && (
                    <p className="mt-4 text-lg leading-relaxed text-slate-600">
                        {post.excerpt}
                    </p>
                )}
            </header>

            {post.imageUrl && (
                <div className="relative mb-12 aspect-[21/9] w-full overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                        src={post.imageUrl}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                        loader={post.imageUrl.startsWith("https://res.cloudinary.com") ? cloudinaryLoader : undefined}
                    />
                </div>
            )}

            <div
                className="prose prose-slate prose-lg max-w-none prose-emerald"
                dangerouslySetInnerHTML={{ __html: post.content }}
            />
        </article>
    );
}
