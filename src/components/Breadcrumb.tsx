"use client";
import Link from "next/link";
import React from "react";

interface BreadcrumbItem {
  name: string;
  href: string;
  isCurrent?: boolean;
}

interface BreadcrumbProps {
  path: BreadcrumbItem[];
}

const Breadcrumb = ({ path }: BreadcrumbProps) => {
  // Determine items to show on mobile (last two items)
  const mobileItems = path.length > 2 ? path.slice(-2) : path;
  // Determine href for "../" link (second-to-last item or first item if path is short)
  const backHref = path.length > 1 ? path[path.length - 2].href : path[0].href;

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8 overflow-x-auto">
      {/* Mobile view: show "../" and last two items */}
      <div className="sm:hidden flex items-center space-x-2">
        <Link href={backHref} className="hover:underline line-clamp-2 max-w-[150px]">
          ..
        </Link>
        {mobileItems.map((item, index) => (
          <React.Fragment key={item.href}>
            <span className="flex-shrink-0 ">/</span>
            <Link
              href={item.href}
              className={`hover:underline line-clamp-2 max-w-[150px] font-semibold font-[family-name:var(--font-quicksand)] ${
                item.isCurrent ? "font-bold text-gray-900" : ""
              }`}
            >
              {item.name}
            </Link>
          </React.Fragment>
        ))}
      </div>

      {/* Desktop view: show full path */}
      <div className="hidden sm:flex items-center space-x-2">
        {path.map((item, index) => (
          <React.Fragment key={item.href}>
            {index > 0 && <span className="flex-shrink-0">/</span>}
            <Link
              href={item.href}
              className={`hover:underline line-clamp-none max-w-none ${
                item.isCurrent ? "font-bold text-gray-900" : ""
              }`}
            >
              {item.name}
            </Link>
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default Breadcrumb;