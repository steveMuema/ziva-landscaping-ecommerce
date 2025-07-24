"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between">
          <div className="space-x-4">
            <Link href="/admin" className="hover:underline">Dashboard</Link>
            <Link href="/admin/categories" className="hover:underline">Categories</Link>
            <Link href="/admin/subcategories" className="hover:underline">Subcategories</Link>
            <Link href="/admin/products" className="hover:underline">Products</Link>
          </div>
          <button onClick={() => signOut()} className="hover:underline">Sign Out</button>
        </div>
      </nav>
      <div className="container mx-auto p-4">{children}</div>
    </div>
  );
}