"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { uploadImage } from "@/lib/cloudinary";
import { requireEditor } from "@/lib/admin-auth";
import { catalogNameError, slugify } from "@/lib/slug";
import { revalidateCatalog } from "@/lib/revalidate-catalog";
import { audit, diff } from "@/lib/audit";

function back(path: string, params: { error?: string; notice?: string }): never {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    redirect(`${path}?${qs}`);
}

async function imageFrom(formData: FormData): Promise<string | null> {
    const file = formData.get("image") as File | null;
    return file && file.size > 0 ? uploadImage(file) : null;
}

/** Another category whose name maps to the same URL, if any. */
async function categoryNameTaken(name: string, excludeId?: number) {
    const all = await prisma.category.findMany({ select: { id: true, name: true } });
    return all.some((c) => c.id !== excludeId && slugify(c.name) === slugify(name));
}

async function subCategoryNameTaken(name: string, categoryId: number, excludeId?: number) {
    const siblings = await prisma.subCategory.findMany({ where: { categoryId }, select: { id: true, name: true } });
    return siblings.some((s) => s.id !== excludeId && slugify(s.name) === slugify(name));
}

// ── Categories ──────────────────────────────────────────────────────────────

export async function createCategory(formData: FormData): Promise<void> {
    const user = await requireEditor();
    const path = "/admin/categories";
    const name = ((formData.get("name") as string) || "").trim();
    const nameError = catalogNameError(name);
    if (nameError) back(path, { error: nameError });
    if (await categoryNameTaken(name)) back(path, { error: `A category named “${name}” already exists.` });
    const imageUrl = await imageFrom(formData);
    const isAgriculture = formData.get("isAgriculture") === "on";
    const created = await prisma.category.create({ data: { name, imageUrl, isAgriculture } });
    await audit(user, { action: "category.create", entity: "Category", entityId: created.id, summary: `Created category “${name}”` });
    revalidateCatalog();
    back(path, { notice: `Added “${name}”.` });
}

export async function updateCategory(id: number, formData: FormData): Promise<void> {
    const user = await requireEditor();
    const path = `/admin/categories/${id}/edit`;
    const name = ((formData.get("name") as string) || "").trim();
    const nameError = catalogNameError(name);
    if (nameError) back(path, { error: nameError });
    if (await categoryNameTaken(name, id)) back(path, { error: `A category named “${name}” already exists.` });
    const description = ((formData.get("description") as string) || "").trim() || null;
    const isAgriculture = formData.get("isAgriculture") === "on";
    const newImage = await imageFrom(formData);
    const removeImage = formData.get("removeImage") === "on";
    const before = await prisma.category.findUnique({ where: { id } });
    if (!before) back("/admin/categories", { error: "That category no longer exists." });
    const after = await prisma.category.update({
        where: { id },
        data: {
            name,
            description,
            isAgriculture,
            ...(newImage ? { imageUrl: newImage } : removeImage ? { imageUrl: null } : {}),
        },
    });
    await audit(user, {
        action: "category.update", entity: "Category", entityId: id, summary: `Edited category “${name}”`,
        changes: diff(before, after, ["name", "description", "isAgriculture", "imageUrl"]),
    });
    revalidateCatalog();
    back("/admin/categories", { notice: `Saved “${name}”.` });
}

export async function deleteCategory(id: number): Promise<void> {
    const user = await requireEditor();
    const category = await prisma.category.findUnique({
        where: { id },
        select: { name: true, _count: { select: { subCategories: true } } },
    });
    if (!category) back("/admin/categories", { error: "That category no longer exists." });
    if (category._count.subCategories > 0) {
        back(`/admin/categories/${id}/edit`, {
            error: `Move or delete its ${category._count.subCategories} subcategories first.`,
        });
    }
    await prisma.category.delete({ where: { id } });
    await audit(user, { action: "category.delete", entity: "Category", entityId: id, summary: `Deleted category “${category.name}”` });
    revalidateCatalog();
    back("/admin/categories", { notice: `Deleted “${category.name}”.` });
}

// ── Subcategories ───────────────────────────────────────────────────────────

export async function createSubCategory(formData: FormData): Promise<void> {
    const user = await requireEditor();
    const path = "/admin/subcategories";
    const name = ((formData.get("name") as string) || "").trim();
    const categoryId = parseInt(formData.get("categoryId") as string, 10);
    const nameError = catalogNameError(name);
    if (nameError) back(path, { error: nameError });
    if (isNaN(categoryId)) back(path, { error: "Choose a category." });
    if (await subCategoryNameTaken(name, categoryId)) {
        back(path, { error: `That category already has a subcategory named “${name}”.` });
    }
    const imageUrl = await imageFrom(formData);
    const created = await prisma.subCategory.create({ data: { name, categoryId, imageUrl } });
    await audit(user, { action: "subcategory.create", entity: "SubCategory", entityId: created.id, summary: `Created subcategory “${name}”` });
    revalidateCatalog();
    back(path, { notice: `Added “${name}”.` });
}

export async function updateSubCategory(id: number, formData: FormData): Promise<void> {
    const user = await requireEditor();
    const path = `/admin/subcategories/${id}/edit`;
    const name = ((formData.get("name") as string) || "").trim();
    const categoryId = parseInt(formData.get("categoryId") as string, 10);
    const nameError = catalogNameError(name);
    if (nameError) back(path, { error: nameError });
    if (isNaN(categoryId)) back(path, { error: "Choose a category." });
    if (await subCategoryNameTaken(name, categoryId, id)) {
        back(path, { error: `That category already has a subcategory named “${name}”.` });
    }
    const description = ((formData.get("description") as string) || "").trim() || null;
    const newImage = await imageFrom(formData);
    const removeImage = formData.get("removeImage") === "on";
    const before = await prisma.subCategory.findUnique({ where: { id } });
    if (!before) back("/admin/subcategories", { error: "That subcategory no longer exists." });
    const after = await prisma.subCategory.update({
        where: { id },
        data: {
            name,
            categoryId,
            description,
            ...(newImage ? { imageUrl: newImage } : removeImage ? { imageUrl: null } : {}),
        },
    });
    await audit(user, {
        action: "subcategory.update", entity: "SubCategory", entityId: id, summary: `Edited subcategory “${name}”`,
        changes: diff(before, after, ["name", "categoryId", "description", "imageUrl"]),
    });
    revalidateCatalog();
    back("/admin/subcategories", { notice: `Saved “${name}”.` });
}

export async function deleteSubCategory(id: number): Promise<void> {
    const user = await requireEditor();
    const sub = await prisma.subCategory.findUnique({
        where: { id },
        select: { name: true, _count: { select: { products: true } } },
    });
    if (!sub) back("/admin/subcategories", { error: "That subcategory no longer exists." });
    if (sub._count.products > 0) {
        back(`/admin/subcategories/${id}/edit`, {
            error: `Move or delete its ${sub._count.products} products first (archived products count too).`,
        });
    }
    await prisma.subCategory.delete({ where: { id } });
    await audit(user, { action: "subcategory.delete", entity: "SubCategory", entityId: id, summary: `Deleted subcategory “${sub.name}”` });
    revalidateCatalog();
    back("/admin/subcategories", { notice: `Deleted “${sub.name}”.` });
}
