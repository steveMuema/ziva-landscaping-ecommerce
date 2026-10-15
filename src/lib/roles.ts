/** Role names and admin-area permissions. No server imports, so middleware can use it. */

export const ROLES = ["admin", "editor", "user"] as const;
export type Role = (typeof ROLES)[number];
export type StaffRole = Extract<Role, "admin" | "editor">;

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  editor: "Editor",
  user: "User",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isStaffRole(value: unknown): value is StaffRole {
  return value === "admin" || value === "editor";
}

/**
 * Admin sections an editor may open: catalog, blog and site content.
 * Orders, payments, finance, users and settings stay admin-only.
 */
export const EDITOR_PATHS = [
  "/admin/products",
  "/admin/categories",
  "/admin/subcategories",
  "/admin/blog",
  "/admin/comments",
  "/admin/content",
  "/admin/media",
  "/admin/account",
  "/admin/settings/security",
] as const;

/** Where an editor lands when opening /admin. */
export const EDITOR_HOME = "/admin/products";

export function canAccessAdminPath(role: unknown, pathname: string): boolean {
  if (role === "admin") return true;
  if (role !== "editor") return false;
  return EDITOR_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
