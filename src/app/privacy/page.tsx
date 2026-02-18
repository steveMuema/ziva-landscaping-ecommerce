import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Ziva Landscaping Co.",
  description: "Privacy policy for Ziva Landscaping Co. How we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-full flex flex-col flex-1">
      <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-3xl flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] font-[family-name:var(--font-quicksand)] mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--muted)] mb-8">
          Last updated: February 2025
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-[var(--foreground)] font-[family-name:var(--font-quicksand)]">
          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              1. Who we are
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Ziva Landscaping Co. (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates this website and related services. We are based in Kenya and provide landscaping products and services. This policy describes how we collect, use, and protect your personal information when you use our site and checkout.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              2. Information we collect
            </h2>
            <p className="text-[var(--muted)] leading-relaxed mb-3">
              We collect information you provide and data that helps our site work:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-[var(--muted)]">
              <li><strong className="text-[var(--foreground)]">Checkout and orders:</strong> Phone number and delivery location (address or area) so we can process your order and deliver to you.</li>
              <li><strong className="text-[var(--foreground)]">Cart and wishlist:</strong> A unique identifier stored in your browser (e.g. in a cookie) so we can remember your cart and wishlist across visits.</li>
              <li><strong className="text-[var(--foreground)]">Account (if you sign in):</strong> Email and name you provide when creating or using an account (e.g. for admin access).</li>
              <li><strong className="text-[var(--foreground)]">Usage:</strong> General usage data (e.g. pages visited) may be collected by our hosting and analytics provider to run and improve the site.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              3. How we use your information
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              We use the information above to fulfil orders, communicate about your order (including via phone or WhatsApp if you contact us), remember your cart and preferences, provide and secure your account, improve our website and services, and comply with applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              4. Cookies and similar technologies
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              We use cookies and similar storage (e.g. local storage) to keep you signed in (if applicable), remember your cart and wishlist, and for essential site operation. We may also use analytics cookies to understand how the site is used. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              5. Third parties
            </h2>
            <p className="text-[var(--muted)] leading-relaxed mb-3">
              Your data may be processed or stored by trusted third parties that help us run the service:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-[var(--muted)]">
              <li><strong className="text-[var(--foreground)]">Payment (M-Pesa):</strong> When you pay via M-Pesa, your phone number and payment details are processed by the relevant payment provider and M-Pesa in line with their policies.</li>
              <li><strong className="text-[var(--foreground)]">Maps / address autocomplete:</strong> If you use the delivery location autocomplete, suggestions are provided by Google. Google&apos;s privacy policy and terms apply to that service.</li>
              <li><strong className="text-[var(--foreground)]">Hosting and analytics:</strong> Our site may be hosted and analysed by providers such as Vercel; their processing is governed by their privacy policies.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              6. Data retention and security
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              We keep your order and contact information for as long as needed to fulfil orders, handle complaints, and meet legal obligations. We take reasonable steps to protect your data; no system is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              7. Your rights
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Depending on where you live, you may have the right to access, correct, or delete your personal data, or to object to or restrict certain processing. To exercise these rights or ask questions about your data, contact us using the details below. If you are in Kenya, the Data Protection Act 2019 may also apply.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              8. Changes to this policy
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              We may update this privacy policy from time to time. The &quot;Last updated&quot; date at the top will be revised when we do. Continued use of the site after changes means you accept the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3">
              9. Contact us
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              For privacy-related questions or requests, contact us at{" "}
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
