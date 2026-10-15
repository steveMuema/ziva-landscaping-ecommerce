import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export type AuditChanges = Record<string, { from: unknown; to: unknown }>;

type Actor = { id: string; email: string | null } | null;

type AuditEntry = {
  action: string;
  entity: string;
  entityId?: string | number | null;
  summary: string;
  changes?: AuditChanges | null;
};

/** Record an admin action. Never throws: a failed log must not break the action itself. */
export async function audit(actor: Actor, entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: actor?.id ?? null,
        userEmail: actor?.email ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId != null ? String(entry.entityId) : null,
        summary: entry.summary.slice(0, 500),
        changes: entry.changes && Object.keys(entry.changes).length > 0
          ? (entry.changes as Prisma.InputJsonValue)
          : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

function normalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  return value ?? null;
}

/** Field-level differences between two records, limited to `fields`. Undefined when nothing changed. */
export function diff<T extends Record<string, unknown>>(
  before: Partial<T>,
  after: Partial<T>,
  fields: (keyof T & string)[]
): AuditChanges | undefined {
  const changes: AuditChanges = {};
  for (const field of fields) {
    if (!(field in after)) continue;
    const from = normalize(before[field]);
    const to = normalize(after[field]);
    if (JSON.stringify(from) !== JSON.stringify(to)) changes[field] = { from, to };
  }
  return Object.keys(changes).length > 0 ? changes : undefined;
}
