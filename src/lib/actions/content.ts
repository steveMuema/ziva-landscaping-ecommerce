"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/admin-auth";
import { audit, type AuditChanges } from "@/lib/audit";
import { CONTENT_INFO, CONTENT_SCHEMAS, getContent, isContentKey, type ContentKey } from "@/lib/content";
import { sanitizeBlogHtml } from "@/lib/sanitize";

export type SaveContentResult = { ok: boolean; error?: string; fieldErrors?: Record<string, string> };

function refresh(key: ContentKey) {
    revalidateTag("content");
    revalidatePath("/", "layout");
    revalidatePath(CONTENT_INFO[key].publicPath);
    revalidatePath("/admin/content");
}

/** Top-level fields that differ, for the audit log (long values are summarised). */
function summariseChanges(before: Record<string, unknown>, after: Record<string, unknown>): AuditChanges {
    const changes: AuditChanges = {};
    const short = (v: unknown) => {
        const text = typeof v === "string" ? v : JSON.stringify(v);
        return text.length > 200 ? `${text.slice(0, 200)}…` : v;
    };
    for (const field of Object.keys(after)) {
        if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
            changes[field] = { from: short(before[field]), to: short(after[field]) };
        }
    }
    return changes;
}

export async function saveContent(key: string, data: unknown): Promise<SaveContentResult> {
    const user = await requireEditor();
    if (!isContentKey(key)) return { ok: false, error: "Unknown content block." };

    const parsed = CONTENT_SCHEMAS[key].safeParse(data);
    if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
            const path = issue.path.join(".");
            if (!fieldErrors[path]) fieldErrors[path] = issue.message;
        }
        return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
    }

    const value = { ...parsed.data } as Record<string, unknown>;
    if (typeof value.html === "string") value.html = sanitizeBlogHtml(value.html);

    const before = (await getContent(key)) as Record<string, unknown>;
    await prisma.contentBlock.upsert({
        where: { key },
        create: { key, data: value as Prisma.InputJsonValue, updatedById: user.id },
        update: { data: value as Prisma.InputJsonValue, updatedById: user.id },
    });
    await audit(user, {
        action: "content.update",
        entity: "ContentBlock",
        entityId: key,
        summary: `Edited ${CONTENT_INFO[key].label}`,
        changes: summariseChanges(before, value),
    });
    refresh(key);
    return { ok: true };
}

/** Go back to the built-in default text. */
export async function resetContent(key: string): Promise<SaveContentResult> {
    const user = await requireEditor();
    if (!isContentKey(key)) return { ok: false, error: "Unknown content block." };
    await prisma.contentBlock.deleteMany({ where: { key } });
    await audit(user, {
        action: "content.reset",
        entity: "ContentBlock",
        entityId: key,
        summary: `Reset ${CONTENT_INFO[key].label} to the built-in default`,
    });
    refresh(key);
    return { ok: true };
}
