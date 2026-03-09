export const PAGE_SIZE = 20;

/** Returns the slice of items for the current page. Pass the full array and current page number. */
export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE): T[] {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
}
