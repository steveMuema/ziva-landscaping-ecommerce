// app/sitemap.xml/route.ts
import { getCategories } from '@/lib/api';
import { slugify } from '@/lib/slug';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zivalandscaping.co.ke';
  const categories = await getCategories();

  const urls: { url: string; lastModified: Date; changeFrequency: string; priority: number }[] = [];

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

  urls.push({
    url: `${baseUrl}/agriculture`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  });

  urls.push({
    url: `${baseUrl}/company`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  });

  urls.push({
    url: `${baseUrl}/blog`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  });

  urls.push({
    url: `${baseUrl}/privacy`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  });

  urls.push({
    url: `${baseUrl}/terms`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  });

  // Add category, subcategory, and product URLs (slugify matches app routes)
  for (const category of categories) {
    const categorySlug = slugify(category.name);
    urls.push({
      url: `${baseUrl}/shop/${categorySlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    for (const subCategory of category.subCategories) {
      const subCategorySlug = slugify(subCategory.name);
      urls.push({
        url: `${baseUrl}/shop/${categorySlug}/${subCategorySlug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });

      for (const product of subCategory.products) {
        urls.push({
          url: `${baseUrl}/shop/${categorySlug}/${subCategorySlug}/${product.id}`,
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
      'Content-Type': 'text/xml; charset=utf-8',
    },
  });
}