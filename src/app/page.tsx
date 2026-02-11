import Footer from "@/components/Footer";
import PromoSection from "@/sections/promo.section";

export const revalidate = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zivalandscaping.co.ke";

export default async function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ziva Landscaping Co.",
    url: siteUrl,
    description: "Landscape design and sustainability in East Africa. Eco-friendly outdoor spaces, drought-resistant plants, organic practices. Kenya.",
    areaServed: { "@type": "Place", name: "East Africa" },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col flex-1 min-h-full">
        <div className="flex-1">
          <PromoSection />
        </div>
        <Footer />
      </div>
    </>
  );
}