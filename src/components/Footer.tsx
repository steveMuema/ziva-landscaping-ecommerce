/* eslint-disable react/no-unescaped-entities */
// src/app/components/Footer.tsx
import Image from "next/image";
import Link from "next/link";

export default async function Footer() {
  return (
    <footer className="bg-white text-white min-h-[250px] pt-10 border-t-2 border-gray-300 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Ziva Icon and Description */}
        <div className="flex flex-col items-start mb-12">
          {/* Ziva Icon (Placeholder SVG) */}
          <div className="ml-4 flex lg:ml-0">
            <Image
                alt="Ziva Landscaping Co."
                src="/Ziva_logo_3.ico"
                className="h-12 w-auto mb-4"
                width={255}
                height={80}
            />
        </div>
          {/* Description (Full Width, Wraps on Small Screens) */}
          <p className="text-sm text-gray-800 mb-6">
            To nurture thriving, sustainable landscapes that flourish with beauty, health and innovation while preserving our planet's precious resources
          </p>
          {/* Social Links (Horizontal) */}
          <div className="flex space-x-6 mb-2">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800 hover:text-white transition-colors"
            >
              <span className="sr-only">Facebook</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800 hover:text-white transition-colors"
            >
              <span className="sr-only">Instagram</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.173.281 2.686.531.576.267 1.008.594 1.448 1.033.44.44.766.872 1.033 1.448.25.513.469 1.32.531 2.686.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.281 2.173-.531 2.686-.267.576-.594 1.008-1.033 1.448-.44.44-.872.766-1.448 1.033-.513.25-1.32.469-2.686.531-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.173-.281-2.686-.531-.576-.267-1.008-.594-1.448-1.033-.44-.44-.766-.872-1.033-1.448-.25-.513-.469-1.32-.531-2.686-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.281-2.173.531-2.686.267-.576.594-1.008 1.033-1.448.44-.44.872-.766 1.448-1.033.513-.25 1.32-.469 2.686-.531 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.67.014-4.95.072-1.315.064-2.211.298-2.987.653-.848.396-1.551.894-2.237 1.582-.686.688-1.186 1.389-1.582 2.237-.355.776-.589 1.672-.653 2.987-.058 1.28-.072 1.691-.072 4.95s.014 3.67.072 4.95c.064 1.315.298 2.211.653 2.987.396.848.894 1.551 1.582 2.237.688.686 1.389 1.186 2.237 1.582.776.355 1.672.589 2.987.653 1.28.058 1.691.072 4.95.072s3.67-.014 4.95-.072c1.315-.064 2.211-.298 2.987-.653.848-.396 1.551-.894 2.237-1.582.686-.688 1.186-1.389 1.582-2.237.355-.776.589-1.672.653-2.987.058-1.28.072-1.691.072-4.95s-.014-3.67-.072-4.95c-.064-1.315-.298-2.211-.653-2.987-.396-.848-.894-1.551-1.582-2.237-.688-.686-1.389-1.186-2.237-1.582-.776-.355-1.672-.589-2.987-.653-1.28-.058-1.691-.072-4.95-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.441s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.441-1.441-1.441z"/>
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800 hover:text-white transition-colors"
            >
              <span className="sr-only">Twitter</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 01-3.14 2.6 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Three-Column Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
          {/* Our Stores */}
          <div>
            <h3 className="text-lg font-bold mb-2">Our Stores</h3>
            <ul className="space-y-2 text-sm text-gray-800">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Kiambu Town, Kiambu County, Kenya
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Westlands, Nairobi County, Kenya
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Ngong, Nairobi County, Kenya
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-bold mb-2">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-800">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  License
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-lg font-bold mb-2">Contact Us</h3>
            <p className="text-sm text-gray-800">Email: info@zivalandscaping.com</p>
            <p className="text-sm text-gray-800">Phone: +254720651312</p>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-gray-300 my-8"></div>

        {/* Copyright Line */}
        <div className="text-center text-xs text-gray-800">
          © {new Date().getFullYear()} Ziva Landscaping CO. All rights reserved.
        </div>
      </div>
    </footer>
  );
}