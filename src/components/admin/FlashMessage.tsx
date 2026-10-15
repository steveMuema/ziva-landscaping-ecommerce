/** Success or error banner driven by ?notice= / ?error= search params set by admin server actions. */
export function FlashMessage({ error, notice }: { error?: string; notice?: string }) {
    if (error) {
        return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
    }
    if (notice) {
        return <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>;
    }
    return null;
}
