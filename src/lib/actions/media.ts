"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/admin-auth";
import { deleteImage, uploadImage } from "@/lib/cloudinary";
import { audit } from "@/lib/audit";

const MAX_FILES = 20;
const MAX_BYTES = 10 * 1024 * 1024;

function back(params: { error?: string; notice?: string }): never {
    redirect(`/admin/media?${new URLSearchParams(params as Record<string, string>).toString()}`);
}

export async function uploadMedia(formData: FormData): Promise<void> {
    const user = await requireEditor();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) back({ error: "Choose one or more images." });
    if (files.length > MAX_FILES) back({ error: `Upload at most ${MAX_FILES} images at a time.` });
    const bad = files.find((f) => !f.type.startsWith("image/") || f.size > MAX_BYTES);
    if (bad) back({ error: `“${bad.name}” is not an image under 10 MB.` });

    for (const file of files) await uploadImage(file);
    await audit(user, {
        action: "media.upload", entity: "Media",
        summary: `Uploaded ${files.length} image(s): ${files.map((f) => f.name).join(", ").slice(0, 300)}`,
    });
    revalidatePath("/admin/media");
    back({ notice: `Uploaded ${files.length} image${files.length === 1 ? "" : "s"}.` });
}

/** Where an image URL is still used, as human-readable labels. */
export async function findMediaUsage(url: string): Promise<string[]> {
    await requireEditor();
    const [products, categories, subCategories, posts, settings, blocks] = await Promise.all([
        prisma.product.findMany({ where: { OR: [{ imageUrl: url }, { images: { has: url } }] }, select: { name: true } }),
        prisma.category.findMany({ where: { imageUrl: url }, select: { name: true } }),
        prisma.subCategory.findMany({ where: { imageUrl: url }, select: { name: true } }),
        prisma.blogPost.findMany({ where: { OR: [{ imageUrl: url }, { content: { contains: url } }] }, select: { title: true } }),
        prisma.setting.findMany({ where: { value: url }, select: { key: true } }),
        prisma.contentBlock.findMany({ select: { key: true, data: true } }),
    ]);
    return [
        ...products.map((p) => `product “${p.name}”`),
        ...categories.map((c) => `category “${c.name}”`),
        ...subCategories.map((s) => `subcategory “${s.name}”`),
        ...posts.map((p) => `blog post “${p.title}”`),
        ...settings.map((s) => `setting ${s.key}`),
        ...blocks.filter((b) => JSON.stringify(b.data).includes(url)).map((b) => `site content “${b.key}”`),
    ];
}

/** Delete an unused image from Cloudinary and the library. Refuses while it is still in use. */
export async function deleteMedia(id: number): Promise<void> {
    const user = await requireEditor();
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) back({ error: "That image no longer exists." });

    const usage = await findMediaUsage(media.url);
    if (usage.length > 0) {
        back({ error: `Still used by ${usage.slice(0, 5).join(", ")}${usage.length > 5 ? "…" : ""}. Remove it there first.` });
    }

    if (media.publicId) {
        try {
            await deleteImage(media.publicId);
        } catch (error) {
            console.error("Cloudinary delete failed:", error);
            back({ error: "Could not delete the file from Cloudinary. Try again later." });
        }
    }
    await prisma.media.delete({ where: { id } });
    await audit(user, { action: "media.delete", entity: "Media", entityId: id, summary: `Deleted image ${media.filename ?? media.url}` });
    revalidatePath("/admin/media");
    back({ notice: "Image deleted." });
}
