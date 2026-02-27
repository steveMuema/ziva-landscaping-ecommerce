"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Records a page view for dashboard analytics. Skips admin and API routes.
 */
export function RecordPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.startsWith("/auth")) return;
    fetch(`/api/record-view?path=${encodeURIComponent(pathname)}`).catch(() => {});
  }, [pathname]);

  return null;
}
