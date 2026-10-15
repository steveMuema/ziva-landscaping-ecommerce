import { revalidatePath } from "next/cache";

/** Refresh every page that lists categories, subcategories or products. */
export function revalidateCatalog() {
  revalidatePath("/admin", "layout");
  revalidatePath("/shop", "layout");
  revalidatePath("/agriculture");
  revalidatePath("/");
}
