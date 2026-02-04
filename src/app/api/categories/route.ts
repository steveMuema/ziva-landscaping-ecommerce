import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: { subCategories: true },
  });
  const formattedCategories = categories.map((category) => ({
    id: category.id.toString(),
    name: category.name,
    featured: [
      {
        name: "New Arrivals",
        href: `/shop/${category.name.toLowerCase().replace(/\s+/g, "-")}`,
        imageSrc: category.imageUrl || "https://tailwindcss.com/plus-assets/img/ecommerce-images/mega-menu-category-01.jpg",
        imageAlt: `Featured ${category.name}`,
      },
      {
        name: "Popular Items",
        href: `/shop/${category.name.toLowerCase().replace(/\s+/g, "-")}`,
        imageSrc: category.imageUrl || "https://tailwindcss.com/plus-assets/img/ecommerce-images/mega-menu-category-02.jpg",
        imageAlt: `Popular ${category.name} items`,
      },
    ],
    sections: [
      {
        id: category.id.toString(),
        name: category.name,
        items: category.subCategories.map((sub) => ({
          name: sub.name,
          href: `/shop/${category.name.toLowerCase().replace(/\s+/g, "-")}/${sub.name.toLowerCase().replace(/\s+/g, "-")}`,
        })),
      },
    ],
  }));
  return NextResponse.json(formattedCategories);
}