import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service — Ziva Landscaping Co.",
  description: "Terms of service for using Ziva Landscaping Co. website and ordering products.",
};

export default function TermsPage() {
  return (
    <div className="min-h-full flex flex-col flex-1">
      <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-3xl flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] font-[family-name:var(--font-quicksand)] mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-[var(--muted)] mb-8">
          Last updated: February 2025
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-[var(--foreground)] font-[family-name:var(--font-quicksand)]">
          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              1. Acceptance of terms
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              By using this website and placing orders with Ziva Landscaping Co. (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you agree to these Terms of Service and to our Privacy Policy. If you do not agree, please do not use the site or place orders.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              2. Use of the website
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              You may use this website for lawful purposes only. You must not use it to transmit harmful or illegal content, attempt to gain unauthorised access to our systems or data, or interfere with the site&apos;s operation. We may suspend or restrict access if we believe you have breached these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              3. Orders and payment
            </h2>
            <p className="text-[var(--muted)] leading-relaxed mb-3">
              When you place an order, you provide accurate contact and delivery details. Orders are subject to acceptance and availability. We may contact you to confirm details or discuss delivery.
            </p>
            <p className="text-[var(--muted)] leading-relaxed">
              Payment may be made via M-Pesa (as described at checkout) or cash on delivery where offered. For M-Pesa, you must complete the prompt on your phone; failure to pay may result in order cancellation. Prices are in Kenyan Shillings (KSH) unless stated otherwise. We reserve the right to correct pricing errors.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              4. Delivery
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Delivery terms (areas, timing, and charges) will be communicated when we process your order. You are responsible for providing a valid delivery location and being available to receive the order where applicable. Risk in products passes to you on delivery unless otherwise agreed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              5. Products and availability
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              We strive to show accurate product information and availability. We do not guarantee that all items are in stock at all times. We may cancel or substitute items and will inform you where reasonably possible. Images are for illustration; actual products may vary slightly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              6. Returns and refunds
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Our returns and refund policy will be communicated at the time of order or on request. Generally, we aim to resolve genuine issues with orders (e.g. wrong or defective items) in line with applicable consumer law. Contact us to discuss any problem with your order.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              7. Intellectual property
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              The website content, branding, logos, and materials are owned by or licensed to us. You may not copy, modify, or use them for commercial purposes without our written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              8. Disclaimers
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              The website is provided &quot;as is&quot;. We do not warrant that it will be error-free or uninterrupted. Advice and information on the site (e.g. plant care, landscaping) are for general guidance only and do not replace professional advice where needed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              9. Limitation of liability
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential loss (e.g. loss of profit or data) arising from your use of the site or orders. Our liability for direct loss relating to an order is limited to the amount you paid for that order, except where law does not allow such limitation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              10. Governing law
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              These terms are governed by the laws of Kenya. Any dispute shall be subject to the exclusive jurisdiction of the courts of Kenya, without prejudice to your statutory rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              11. Changes
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              We may update these Terms of Service from time to time. The &quot;Last updated&quot; date at the top will be revised when we do. Continued use of the site or placement of orders after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              12. Contact
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              For questions about these terms or your orders, contact us at{" "}
              <a href="mailto:sales@zivalandscaping.co.ke" className="text-[var(--accent)] hover:underline">
                sales@zivalandscaping.co.ke
              </a>{" "}
              or by phone/WhatsApp: +25457133726.
            </p>
          </section>
        </div>

        <p className="mt-10">
          <Link
            href="/"
            className="text-[var(--accent)] hover:underline font-[family-name:var(--font-quicksand)]"
          >
            ← Back to home
          </Link>
        </p>
      </article>
      <Footer />
    </div>
  );
}
