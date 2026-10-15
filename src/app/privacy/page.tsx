import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { PolicyPage } from "@/components/PolicyPage";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContent("page.privacy");
  return { title: `${page.title} — Ziva Landscaping Co.`, description: page.metaDescription || undefined };
}

export default async function PrivacyPage() {
  const page = await getContent("page.privacy");
  return <PolicyPage title={page.title} lastUpdated={page.lastUpdated} html={page.html} />;
}
