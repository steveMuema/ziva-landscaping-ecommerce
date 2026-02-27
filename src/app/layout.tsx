import type { Metadata } from "next";
import { Geist, Geist_Mono, Quicksand } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { ProductProvider } from "@/lib/productContext";
import { CartSidebarProvider } from "@/lib/cartSidebarContext";
import { ThemeProvider } from "@/lib/themeContext";
import { SessionProvider } from "@/components/SessionProvider";
import RootLayoutContent from "@/components/RootLayoutContent";
import { RecordPageView } from "@/components/RecordPageView";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zivalandscaping.co.ke";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Ziva Landscaping Co. — Sustainable Living | East Africa",
    template: "%s | Ziva Landscaping Co."
  },
  description:
    "Landscape design and sustainability in East Africa. Eco-friendly outdoor spaces, drought-resistant plants, edible landscape, organic practices. Kenya, Tanzania, Uganda. BNB Ziva Homes.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Ziva Landscaping" },
  keywords: [
    "Ziva Landscaping",
    "landscaping Kenya",
    "East Africa landscaping",
    "sustainable landscaping",
    "eco-friendly garden",
    "Nairobi landscaping",
    "drought resistant plants",
    "organic landscaping",
    "Ziva Homes",
    "BNB",
  ],
  openGraph: {
    title: "Ziva Landscaping Co. — Sustainable Living | East Africa",
    description: "Eco-friendly landscaping and sustainable outdoor spaces across East Africa.",
    locale: "en_KE",
    type: "website",
    siteName: "Ziva Landscaping Co.",
    url: baseUrl,
    images: [
      {
        url: "/ziva_logo.jpg",
        width: 800,
        height: 600,
        alt: "Ziva Landscaping Co. Logo",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ziva Landscaping Co.",
    description: "Eco-friendly landscaping and sustainable outdoor spaces across East Africa.",
    images: ["/ziva_logo.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#166534",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#166534" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ziva Landscaping" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="google-site-verification" content="B89P2_oagqXB0lGJi_HMS_U1pWBcxsY25mvlezbRJns" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=document.documentElement.getAttribute('data-theme')||localStorage.getItem('ziva-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);})();if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js');});}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Ziva Landscaping Co.",
              "image": `${baseUrl}/ziva_logo.jpg`,
              "description": "Landscape design and sustainability in East Africa. Eco-friendly outdoor spaces, drought-resistant plants, edible landscape, organic practices.",
              "url": baseUrl,
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "KE",
                "addressLocality": "Nairobi"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <ThemeProvider>
            <CartSidebarProvider>
              <ProductProvider>
                <CartProvider>
                  <WishlistProvider>
                    <RootLayoutContent>{children}</RootLayoutContent>
                  </WishlistProvider>
                </CartProvider>
              </ProductProvider>
            </CartSidebarProvider>
          </ThemeProvider>
        </SessionProvider>
        <RecordPageView />
        <Analytics />
      </body>
    </html>
  );
}