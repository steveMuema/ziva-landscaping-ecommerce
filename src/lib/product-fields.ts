import type { ProductStatus } from "@prisma/client";

export const PRODUCT_STATUSES: ProductStatus[] = ["ACTIVE", "DRAFT", "ARCHIVED"];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  ACTIVE: "Active",
  DRAFT: "Draft",
  ARCHIVED: "Archived",
};

export function isProductStatus(value: unknown): value is ProductStatus {
  return typeof value === "string" && (PRODUCT_STATUSES as string[]).includes(value);
}

export const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._\-\/]{0,63}$/;

/** Default cost when none is given: 10% below the selling price. */
export function defaultCost(price: number): number {
  return Math.round(price * 0.9 * 100) / 100;
}
