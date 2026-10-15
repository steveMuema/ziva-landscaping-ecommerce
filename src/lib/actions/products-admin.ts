"use server";

import { Prisma, type ProductStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";
import { requireEditor } from "@/lib/admin-auth";
import { revalidateCatalog } from "@/lib/revalidate-catalog";
import { audit, diff } from "@/lib/audit";
import { parseCsv, unguardCell } from "@/lib/csv";
import { PRODUCT_STATUS_LABELS, SKU_PATTERN, defaultCost, isProductStatus } from "@/lib/product-fields";

const MAX_IMPORT_ROWS = 2000;
const AUDITED_FIELDS = [
    "name", "sku", "status", "price", "compareAtPrice", "cost", "stock", "subCategoryId", "tags",
    "description", "imageUrl", "images", "metaTitle", "metaDescription",
] as const;
const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

function back(path: string, params: { error?: string; notice?: string }): never {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    redirect(`${path}?${qs}`);
}

function isUniqueViolation(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

type ProductFields = {
    name: string;
    description: string | null;
    price: number;
    compareAtPrice: number | null;
    cost: number;
    stock: number;
    subCategoryId: number;
    tags: string[];
    sku: string | null;
    status: ProductStatus;
    metaTitle: string | null;
    metaDescription: string | null;
};

/** Validate the shared product form. Returns the fields or a message for the admin. */
function readProductForm(formData: FormData): ProductFields | string {
    const text = (key: string) => ((formData.get(key) as string) || "").trim();
    const name = text("name");
    const price = parseFloat(text("price"));
    const compareRaw = text("compareAtPrice");
    const compareAtPrice = compareRaw ? parseFloat(compareRaw) : null;
    const costRaw = text("cost");
    const cost = costRaw ? parseFloat(costRaw) : null;
    const stock = parseInt(text("stock"), 10);
    const subCategoryId = parseInt(text("subCategoryId"), 10);
    const sku = text("sku") || null;
    const status = text("status") || "ACTIVE";

    if (!name) return "Name is required.";
    if (isNaN(price) || price < 0) return "Enter a valid selling price.";
    if (compareAtPrice != null && (isNaN(compareAtPrice) || compareAtPrice <= price)) {
        return "The “was” price must be higher than the selling price (or left empty).";
    }
    if (cost != null && (isNaN(cost) || cost < 0)) return "Enter a valid cost.";
    if (isNaN(stock) || stock < 0) return "Stock must be 0 or more.";
    if (isNaN(subCategoryId)) return "Choose a subcategory.";
    if (sku && !SKU_PATTERN.test(sku)) return "SKU may use letters, numbers, . _ - / (up to 64 characters).";
    if (!isProductStatus(status)) return "Invalid status.";

    return {
        name,
        description: text("description") || null,
        price,
        compareAtPrice,
        cost: cost ?? defaultCost(price),
        stock,
        subCategoryId,
        tags: text("tags").split(",").map((t) => t.trim()).filter(Boolean),
        sku,
        status,
        metaTitle: text("metaTitle") || null,
        metaDescription: text("metaDescription") || null,
    };
}

/** Library picks: only URLs that are actually in the media library are accepted. */
async function libraryUrls(values: FormDataEntryValue[]): Promise<string[]> {
    const urls = [...new Set(values.map(String).filter(Boolean))];
    if (urls.length === 0) return [];
    const known = await prisma.media.findMany({ where: { url: { in: urls } }, select: { url: true } });
    const ok = new Set(known.map((m) => m.url));
    return urls.filter((u) => ok.has(u));
}

async function uploadAll(files: FormDataEntryValue[]): Promise<string[]> {
    const real = files.filter((f): f is File => f instanceof File && f.size > 0);
    return Promise.all(real.map((f) => uploadImage(f)));
}

// ── Single product ──────────────────────────────────────────────────────────

export async function createProduct(formData: FormData): Promise<void> {
    const user = await requireEditor();
    const fields = readProductForm(formData);
    if (typeof fields === "string") back("/admin/products", { error: fields });

    const [imageUrl] = [...(await uploadAll(formData.getAll("image"))), ...(await libraryUrls(formData.getAll("imageFromLibrary")))];
    try {
        const created = await prisma.product.create({ data: { ...fields, imageUrl: imageUrl ?? null } });
        await audit(user, { action: "product.create", entity: "Product", entityId: created.id, summary: `Created product “${fields.name}”` });
    } catch (error) {
        if (isUniqueViolation(error)) back("/admin/products", { error: `SKU “${fields.sku}” is already used by another product.` });
        throw error;
    }
    revalidateCatalog();
    back("/admin/products", { notice: `Added “${fields.name}”.` });
}

export async function updateProduct(productId: number, formData: FormData): Promise<void> {
    const user = await requireEditor();
    const path = `/admin/products/${productId}/edit`;
    const fields = readProductForm(formData);
    if (typeof fields === "string") back(path, { error: fields });

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) back("/admin/products", { error: "That product no longer exists." });

    const [newMain] = [...(await uploadAll(formData.getAll("image"))), ...(await libraryUrls(formData.getAll("imageFromLibrary")))];
    const added = [...(await uploadAll(formData.getAll("galleryImages"))), ...(await libraryUrls(formData.getAll("galleryFromLibrary")))];
    const removed = new Set(formData.getAll("removeImages").map(String));
    const kept = existing.images.filter((url) => !removed.has(url));
    const images = [...kept, ...added.filter((url) => !kept.includes(url))];

    try {
        const after = await prisma.product.update({
            where: { id: productId },
            data: { ...fields, imageUrl: newMain ?? existing.imageUrl, images },
        });
        await audit(user, {
            action: "product.update", entity: "Product", entityId: productId, summary: `Edited product “${fields.name}”`,
            changes: diff(existing, after, [...AUDITED_FIELDS]),
        });
    } catch (error) {
        if (isUniqueViolation(error)) back(path, { error: `SKU “${fields.sku}” is already used by another product.` });
        throw error;
    }
    revalidateCatalog();
    back("/admin/products", { notice: `Saved “${fields.name}”.` });
}

/** Delete a product that was never ordered; ordered products must be archived to keep order history. */
export async function deleteProduct(productId: number): Promise<void> {
    const user = await requireEditor();
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true, _count: { select: { OrderItem: true } } },
    });
    if (!product) back("/admin/products", { error: "That product no longer exists." });
    if (product._count.OrderItem > 0) {
        back(`/admin/products/${productId}/edit`, { error: "This product appears in orders, so it can't be deleted. Archive it instead." });
    }
    await prisma.$transaction([
        prisma.cart.deleteMany({ where: { productId } }),
        prisma.wishlist.deleteMany({ where: { productId } }),
        prisma.product.delete({ where: { id: productId } }),
    ]);
    await audit(user, { action: "product.delete", entity: "Product", entityId: productId, summary: `Deleted product “${product.name}”` });
    revalidateCatalog();
    back("/admin/products", { notice: `Deleted “${product.name}”.` });
}

// ── Bulk actions ────────────────────────────────────────────────────────────

export async function bulkUpdateProducts(formData: FormData): Promise<void> {
    const user = await requireEditor();
    const returnTo = (formData.get("returnTo") as string) || "/admin/products";
    const path = returnTo.startsWith("/admin/products") ? returnTo.split("?")[0] : "/admin/products";
    const ids = formData.getAll("ids").map((v) => parseInt(String(v), 10)).filter((n) => !isNaN(n));
    const action = formData.get("bulkAction") as string;
    if (ids.length === 0) back(path, { error: "Select at least one product." });

    if (isProductStatus(action)) {
        const { count } = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { status: action } });
        await audit(user, {
            action: "product.bulk_status", entity: "Product",
            summary: `Set ${count} product(s) to ${PRODUCT_STATUS_LABELS[action]}: ids ${ids.join(", ")}`,
        });
        revalidateCatalog();
        back(path, { notice: `Set ${count} product${count === 1 ? "" : "s"} to ${PRODUCT_STATUS_LABELS[action]}.` });
    }

    if (action === "DELETE") {
        const ordered = await prisma.orderItem.findMany({
            where: { productId: { in: ids } },
            select: { productId: true },
            distinct: ["productId"],
        });
        const keep = new Set(ordered.map((o) => o.productId));
        const deletable = ids.filter((id) => !keep.has(id));
        if (deletable.length > 0) {
            await prisma.$transaction([
                prisma.cart.deleteMany({ where: { productId: { in: deletable } } }),
                prisma.wishlist.deleteMany({ where: { productId: { in: deletable } } }),
                prisma.product.deleteMany({ where: { id: { in: deletable } } }),
            ]);
            await audit(user, {
                action: "product.bulk_delete", entity: "Product",
                summary: `Deleted ${deletable.length} product(s): ids ${deletable.join(", ")}`,
            });
        }
        revalidateCatalog();
        const skipped = ids.length - deletable.length;
        back(path, {
            notice:
                `Deleted ${deletable.length} product${deletable.length === 1 ? "" : "s"}.` +
                (skipped ? ` Kept ${skipped} that appear in orders — archive those instead.` : ""),
        });
    }

    back(path, { error: "Choose an action." });
}

// ── CSV import ──────────────────────────────────────────────────────────────

const IMPORT_COLUMNS = ["name", "sku", "status", "price", "compareatprice", "cost", "stock", "tags"] as const;

/**
 * Update existing products from a CSV (same columns as the export). Rows are matched by
 * `id`, or by `sku` when there is no id. Every row is checked first; if any row has a
 * problem nothing is changed. Empty cells leave that field unchanged.
 */
export async function importProductsCsv(formData: FormData): Promise<void> {
    const user = await requireEditor();
    const path = "/admin/products";
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) back(path, { error: "Choose a CSV file to import." });
    if (file.size > MAX_IMPORT_BYTES) back(path, { error: "That file is too large (2 MB max)." });

    const rows = parseCsv(await file.text());
    if (rows.length < 2) back(path, { error: "The CSV has no product rows." });
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const col = (name: string) => header.indexOf(name);
    if (col("id") === -1 && col("sku") === -1) back(path, { error: "The CSV needs an “id” or “sku” column." });
    if (!IMPORT_COLUMNS.some((c) => col(c) !== -1)) back(path, { error: "The CSV has no columns to update." });
    if (rows.length - 1 > MAX_IMPORT_ROWS) back(path, { error: `Import at most ${MAX_IMPORT_ROWS} rows at a time.` });

    const products = await prisma.product.findMany({ select: { id: true, sku: true, price: true, compareAtPrice: true } });
    type Row = (typeof products)[number];
    const byId = new Map<number, Row>(products.map((p) => [p.id, p]));
    const bySku = new Map<string, Row>(products.filter((p) => p.sku).map((p) => [p.sku!.toLowerCase(), p]));

    const errors: string[] = [];
    const updates: { id: number; data: Prisma.ProductUpdateInput }[] = [];
    const skusInFile = new Map<string, number>();

    rows.slice(1).forEach((row, i) => {
        const line = i + 2;
        const cell = (name: string) => {
            const idx = col(name);
            return idx === -1 ? "" : unguardCell((row[idx] ?? "").trim());
        };
        const idText = cell("id");
        const product = idText ? byId.get(parseInt(idText, 10)) : bySku.get(cell("sku").toLowerCase());
        if (!product) {
            errors.push(`Row ${line}: no product with ${idText ? `id ${idText}` : `SKU “${cell("sku")}”`}.`);
            return;
        }

        const data: Prisma.ProductUpdateInput = {};
        const num = (name: string, { int = false, min = 0 } = {}) => {
            const raw = cell(name);
            if (!raw) return undefined;
            const n = int ? Number(raw) : parseFloat(raw);
            if (isNaN(n) || n < min || (int && !Number.isInteger(n))) {
                errors.push(`Row ${line}: “${raw}” is not a valid ${name}.`);
                return undefined;
            }
            return n;
        };

        if (cell("name")) data.name = cell("name");
        const price = num("price");
        if (price !== undefined) data.price = price;
        const cost = num("cost");
        if (cost !== undefined) data.cost = cost;
        const stock = num("stock", { int: true });
        if (stock !== undefined) data.stock = stock;
        const compare = num("compareatprice");
        if (compare !== undefined) data.compareAtPrice = compare;
        const finalPrice = price ?? product.price;
        const finalCompare = compare ?? product.compareAtPrice;
        if (finalCompare != null && finalCompare <= finalPrice) {
            errors.push(`Row ${line}: the “was” price must be higher than the selling price.`);
        }

        const status = cell("status").toUpperCase();
        if (status) {
            if (isProductStatus(status)) data.status = status;
            else errors.push(`Row ${line}: status must be ACTIVE, DRAFT or ARCHIVED.`);
        }

        // With an id column, the sku column may set or change the SKU.
        const sku = cell("sku");
        if (idText && col("sku") !== -1 && sku) {
            if (!SKU_PATTERN.test(sku)) errors.push(`Row ${line}: “${sku}” is not a valid SKU.`);
            const owner = bySku.get(sku.toLowerCase());
            if (owner && owner.id !== product.id) errors.push(`Row ${line}: SKU “${sku}” belongs to product ${owner.id}.`);
            const dup = skusInFile.get(sku.toLowerCase());
            if (dup !== undefined && dup !== product.id) errors.push(`Row ${line}: SKU “${sku}” is used twice in the file.`);
            skusInFile.set(sku.toLowerCase(), product.id);
            data.sku = sku;
        }

        if (col("tags") !== -1 && cell("tags")) {
            data.tags = cell("tags").split(/[;,]/).map((t) => t.trim()).filter(Boolean);
        }

        if (Object.keys(data).length > 0) updates.push({ id: product.id, data });
    });

    if (errors.length > 0) {
        const more = errors.length > 5 ? ` …and ${errors.length - 5} more.` : "";
        back(path, { error: `Nothing was imported. ${errors.slice(0, 5).join(" ")}${more}` });
    }
    if (updates.length === 0) back(path, { notice: "The file had no changes to apply." });

    try {
        await prisma.$transaction(updates.map((u) => prisma.product.update({ where: { id: u.id }, data: u.data })));
        await audit(user, {
            action: "product.import", entity: "Product",
            summary: `Updated ${updates.length} product(s) from CSV “${file.name}”: ids ${updates.map((u) => u.id).join(", ")}`,
        });
    } catch (error) {
        if (isUniqueViolation(error)) back(path, { error: "Nothing was imported: two products would end up with the same SKU." });
        throw error;
    }
    revalidateCatalog();
    back(path, { notice: `Updated ${updates.length} product${updates.length === 1 ? "" : "s"} from the CSV.` });
}
