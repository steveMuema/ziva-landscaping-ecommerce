"use client";
import Link from "next/link";

interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbProps {
  path: BreadcrumbItem[];
}

export default function Breadcrumb({ path }: BreadcrumbProps) {
  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-gray-500">
        {path.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.href ? (
              <Link href={item.href} className="hover:text-gray-700">
                {item.name}
              </Link>
            ) : (
              <span className="text-gray-700">{item.name}</span>
            )}
            {index < path.length - 1 && (
              <span className="mx-2">/</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}