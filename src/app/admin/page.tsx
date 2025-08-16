import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route"; // Adjust the import path as needed

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated or not an admin
  if (!session || session.user?.role !== "admin") {
    redirect("/auth/signin"); // or redirect("/shop") if you prefer
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between">
          <div className="space-x-4">
            <Link href="/admin/categories" className="hover:underline">Categories</Link>
            <Link href="/admin/subcategories" className="hover:underline">Subcategories</Link>
            <Link href="/admin/products" className="hover:underline">Products</Link>
          </div>
          <Link href="/auth/signin" className="hover:underline">Sign Out</Link>
        </div>
      </nav>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Admin Dashboard</h1>
        <p className="mb-4 text-gray-700">Welcome to the admin panel. Manage your store categories, subcategories, and products below.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/categories" className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-center">
            Manage Categories
          </Link>
          <Link href="/admin/subcategories" className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-center">
            Manage Subcategories
          </Link>
          <Link href="/admin/products" className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-center">
            Manage Products
          </Link>
        </div>
      </div>
    </div>
  );
}