// app/sitemap.xml/route.ts
import { getCategories } from '@/lib/api'; // Adjust the import path based on your project structure (e.g., from "@/lib/api" if api.ts is there)
import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zivalandscaping.co.ke'; // Replace with your actual site URL or use env variable
  const categories = await getCategories();

  const urls = [];

  // Add home and shop pages
  urls.push({
    url: `${baseUrl}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 1.0,
  });

  urls.push({
    url: `${baseUrl}/shop`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  });

  // Add category, subcategory, and product URLs
  for (const category of categories) {
    const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
    urls.push({
      url: `${baseUrl}/shop/${categorySlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    for (const subCategory of category.subCategories) {
      const subCategorySlug = subCategory.name.toLowerCase().replace(/\s+/g, '-');
      urls.push({
        url: `${baseUrl}/shop/${categorySlug}/${subCategorySlug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });

      for (const product of subCategory.products) {
        const productSlug = product.id;
        urls.push({
          url: `${baseUrl}/shop/${categorySlug}/${subCategorySlug}/${productSlug}`,
          lastModified: product.updatedAt,
          changeFrequency: 'daily',
          priority: 0.6,
        });
      }
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ url, lastModified, changeFrequency, priority }) => `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastModified.toISOString().split('T')[0]}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>
`).join('')}
</urlset>`;

  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}