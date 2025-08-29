import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zivalandscaping.co.ke';
  const robotsTxt = `
User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap_index.xml
  `.trim();
  return new NextResponse(robotsTxt, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}