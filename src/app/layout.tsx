import type { Metadata } from "next";
import { Geist, Geist_Mono, Quicksand } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { ProductProvider } from "@/lib/productContext";
import { CartSidebarProvider } from "@/lib/cartSidebarContext";
import NavigationBar from "@/components/navbar";
import Link from "next/link";
import Image from "next/image";

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

export const metadata: Metadata = {
  title: "Ziva Landscaping CO. — SUSTAINABLE LIVING.",
  description: "We Specialize In Landscaping, Landscape Supplies, Lawn Care & Lawn Services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <meta name="google-site-verification" content="B89P2_oagqXB0lGJi_HMS_U1pWBcxsY25mvlezbRJns" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} antialiased`}
      >
        <CartSidebarProvider>
          <ProductProvider>
            <CartProvider>
              <WishlistProvider>
                <NavigationBar />
                <main>
                  {children}
                  {/* WhatsApp Chat Button */}
                <Link
                  href="https://wa.me/254757133726?text=Hello%20Ziva%20Landscaping%20Co.%2C%20I%27d%20like%20to%20inquire%20about%20your%20services!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fixed bottom-6 right-6 bg-white text-white rounded-full p-2 shadow-lg hover:bg-gray-200 transition-colors duration-300 flex items-center justify-center z-50 font-[family-name:var(--font-quicksand)]"
                  aria-label="Chat with us on WhatsApp"
                >
                  <Image
                    src="/whatsapp.svg"
                    alt="WhatsApp"
                    width={45}
                    height={45}
                  />
                </Link>
                </main>
              </WishlistProvider>
            </CartProvider>
          </ProductProvider>
        </CartSidebarProvider>
        <Analytics />
      </body>
    </html>
  );
}