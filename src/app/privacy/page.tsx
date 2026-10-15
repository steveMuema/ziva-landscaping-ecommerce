import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { PolicyPage } from "@/components/PolicyPage";
import { socialMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContent("page.privacy");
  const description = page.metaDescription || `${page.title} for Ziva Landscaping Co.`;
  return {
    title: page.title,
    description,
    ...socialMetadata({ title: page.title, description, path: "/privacy" }),
  };
}

export default async function PrivacyPage() {
  const page = await getContent("page.privacy");
  return <PolicyPage title={page.title} lastUpdated={page.lastUpdated} html={page.html} />;
}
