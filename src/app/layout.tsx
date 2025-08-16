import type { Metadata } from "next";
import { Geist, Geist_Mono, Quicksand } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { ProductProvider } from "@/lib/productContext";
import { CartSidebarProvider } from "@/lib/cartSidebarContext";
import NavigationBar from "@/components/navbar";

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
  subsets: ["latin"]
})

export const metadata: Metadata = {
  title: "Ziva Landscaping CO. — SUSTAINABLE LIVING. ",
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
                <main>{children}</main>
            </WishlistProvider>
          </CartProvider>
        </ProductProvider>
      </CartSidebarProvider>
      <Analytics/>
      </body>
    </html>
  );
}
