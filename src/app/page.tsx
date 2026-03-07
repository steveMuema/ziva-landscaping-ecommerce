import PromoSection from "@/sections/promo.section";
import AboutUsSection from "@/sections/aboutus.section";
import { getSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/setting-keys";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zivalandscaping.co.ke";
const DEFAULT_PARALLAX_IMAGE = "/landscape.jpeg";

export default async function Home() {
  const settings = await getSettings([SETTING_KEYS.SITE_PARALLAX_IMAGE_URL]);
  const parallaxImageUrl =
    settings[SETTING_KEYS.SITE_PARALLAX_IMAGE_URL]?.trim() || DEFAULT_PARALLAX_IMAGE;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Ziva Landscaping Co.",
      url: siteUrl,
      description: "Landscape design and sustainability in East Africa. Eco-friendly outdoor spaces, drought-resistant plants, organic practices. Kenya.",
      areaServed: { "@type": "Place", name: "East Africa" },
      logo: `${siteUrl}/ziva_logo.jpg`
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Ziva Landscaping Co.",
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/shop?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    }
  ];
  const parallaxBgStyle = {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.25)), url(${parallaxImageUrl})`,
    backgroundAttachment: "fixed",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div
        className="flex flex-col flex-1 min-h-full"
        style={parallaxBgStyle}
      >
        <div className="flex-1">
          <PromoSection />
          <AboutUsSection />
        </div>
      </div>
    </>
  );
}