import type { Metadata } from "next";
import AboutUsSection from "@/sections/aboutus.section";
import { getSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/setting-keys";

export const metadata: Metadata = {
  title: "Company — Mission & Vision | Ziva Landscaping Co",
  description:
    "Ziva Landscaping Co. and Ziva Homes: our mission and vision for sustainable landscaping and eco-friendly outdoor spaces across East Africa. Green, gold, white.",
  keywords: [
    "Ziva Landscaping",
    "mission",
    "vision",
    "sustainable landscaping",
    "East Africa",
    "Kenya",
    "eco-friendly",
  ],
  openGraph: {
    title: "Company — Mission & Vision | Ziva Landscaping Co.",
    description: "Our mission and vision for sustainable, eco-friendly outdoor spaces.",
  },
};

const DEFAULT_PARALLAX_IMAGE = "/landscape.jpeg";

export default async function CompanyPage() {
  const settings = await getSettings([
    SETTING_KEYS.SITE_PARALLAX_IMAGE_URL,
  ]);
  const parallaxUrl = settings[SETTING_KEYS.SITE_PARALLAX_IMAGE_URL]?.trim() || DEFAULT_PARALLAX_IMAGE;

  return (
    <div className="flex flex-col flex-1 min-h-full bg-[var(--background)]">
      <div className="flex-1">
        {/* Hero: parallax background + BNB / Ziva Homes */}
        <section className="relative border-b border-[var(--card-border)] overflow-hidden py-20 sm:py-24 px-4 sm:px-6 lg:px-8 min-h-[280px] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--card-bg)]"
            aria-hidden
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${parallaxUrl})`,
                backgroundAttachment: "fixed",
              }}
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white font-[family-name:var(--font-quicksand)] mb-6 drop-shadow-md">
              Ziva Landscaping Co.
            </h1>
            <p className="text-xl text-white/95 max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-quicksand)] drop-shadow">
              Sustainable living through landscape design: functionality, sustainability, and environment-friendly practices across East Africa.
            </p>
          </div>
        </section>

        {/* Vision */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[var(--card-border)] bg-[var(--background)]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-6 font-[family-name:var(--font-quicksand)] flex items-center gap-2">
              <span className="w-1 h-8 bg-[var(--ziva-gold)] rounded-full" />
              Our vision
            </h2>
            <p className="text-lg text-[var(--muted)] leading-relaxed font-[family-name:var(--font-quicksand)]">
              To be the leading provider of sustainable landscaping and eco-friendly outdoor solutions in East Africa—crafting vibrant spaces that promote well-being, conserve resources, and support local ecosystems.
            </p>
          </div>
        </section>

        <AboutUsSection />
      </div>
    </div>
  );
}
