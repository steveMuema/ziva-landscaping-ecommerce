import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/content";
import { socialMetadata } from "@/lib/seo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zivalandscaping.co.ke";

export async function generateMetadata(): Promise<Metadata> {
  const faq = await getContent("faq");
  const description = faq.intro || "Answers to common questions about Ziva Landscaping Co. products, delivery and services.";
  return {
    title: faq.title,
    description,
    alternates: { canonical: `${siteUrl}/faq` },
    ...socialMetadata({ title: faq.title, description, path: "/faq" }),
  };
}

export default async function FaqPage() {
  const faq = await getContent("faq");

  return (
    <div className="min-h-full flex flex-col flex-1">
      {faq.items.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faq.items.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-3xl flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] font-[family-name:var(--font-quicksand)] mb-3">
          {faq.title}
        </h1>
        {faq.intro && <p className="text-[var(--muted)] mb-8 whitespace-pre-line">{faq.intro}</p>}

        {faq.items.length === 0 ? (
          <p className="text-[var(--muted)]">
            No questions yet. <Link href="/company" className="text-[var(--accent)] hover:underline">Get in touch</Link> and we&apos;ll be happy to help.
          </p>
        ) : (
          <div className="divide-y divide-[var(--card-border)] rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]">
            {faq.items.map((item, i) => (
              <details key={i} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[var(--foreground)] font-[family-name:var(--font-quicksand)]">
                  {item.question}
                  <span aria-hidden className="text-[var(--muted)] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 whitespace-pre-line text-[var(--muted)] leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
