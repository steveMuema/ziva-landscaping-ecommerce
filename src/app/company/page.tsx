import type { Metadata } from "next";
import Footer from "@/components/Footer";
import AboutUsSection from "@/sections/aboutus.section";

export const metadata: Metadata = {
  title: "Company — Mission & Vision | Ziva Landscaping Co. (BNB / Ziva Homes)",
  description:
    "Ziva Landscaping Co. and Ziva Homes: our mission and vision for sustainable landscaping and eco-friendly outdoor spaces across East Africa. Green, gold, white.",
  keywords: [
    "Ziva Landscaping",
    "Ziva Homes",
    "BNB",
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

export default function CompanyPage() {
  return (
    <div className="flex flex-col flex-1 min-h-full bg-[var(--background)]">
      <div className="flex-1">
      {/* Hero: BNB / Ziva Homes */}
      <section className="border-b border-[var(--card-border)] bg-[var(--card-bg)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-[var(--ziva-green)] uppercase tracking-wider font-[family-name:var(--font-quicksand)] mb-4">
            BNB — Ziva Homes
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--foreground)] font-[family-name:var(--font-quicksand)] mb-6">
            Ziva Landscaping Co.
          </h1>
          <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-quicksand)]">
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
      <Footer />
    </div>
  );
}
