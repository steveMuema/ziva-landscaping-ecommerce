import Footer from "@/components/Footer";
import PromoSection from "@/sections/promo.section";
import AboutUsSection from "@/sections/aboutus.section";
import { getSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/setting-keys";

export const revalidate = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zivalandscaping.co.ke";
const DEFAULT_PARALLAX_IMAGE = "/landscape.jpeg";

export default async function Home() {
  const settings = await getSettings([SETTING_KEYS.SITE_PARALLAX_IMAGE_URL]);
  const parallaxImageUrl =
    settings[SETTING_KEYS.SITE_PARALLAX_IMAGE_URL]?.trim() || DEFAULT_PARALLAX_IMAGE;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ziva Landscaping Co.",
    url: siteUrl,
    description: "Landscape design and sustainability in East Africa. Eco-friendly outdoor spaces, drought-resistant plants, organic practices. Kenya.",
    areaServed: { "@type": "Place", name: "East Africa" },
  };
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
      <div className="relative flex flex-col flex-1 min-h-full">
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={parallaxBgStyle}
          aria-hidden
        />
        <div className="relative z-10 flex flex-col flex-1 min-h-full">
          <div className="flex-1">
            <PromoSection />
            <AboutUsSection />
          </div>
          <Footer />
        </div>
      </div>
    </>
  );
}