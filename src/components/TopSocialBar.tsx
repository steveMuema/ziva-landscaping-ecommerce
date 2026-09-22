"use client";

import { useEffect, useState } from "react";
import { FaFacebookF, FaXTwitter, FaPinterest, FaLinkedinIn, FaWhatsapp, FaTelegram } from "react-icons/fa6";
import { SETTING_KEYS } from "@/lib/setting-keys";
import { socialUrl, whatsappUrl } from "@/lib/socials";

type SiteSettings = Record<string, string>;

export default function TopSocialBar() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => setSettings({}));
  }, []);

  const s = (key: string) => (settings?.[key] ?? "").trim();
  const phone = s(SETTING_KEYS.SITE_PHONE_WHATSAPP) || "+25457133726";

  const links = [
    { key: "facebook", label: "Facebook", href: socialUrl(SETTING_KEYS.SOCIAL_FACEBOOK, s(SETTING_KEYS.SOCIAL_FACEBOOK)), Icon: FaFacebookF },
    { key: "twitter", label: "X (Twitter)", href: socialUrl(SETTING_KEYS.SOCIAL_TWITTER, s(SETTING_KEYS.SOCIAL_TWITTER)), Icon: FaXTwitter },
    { key: "pinterest", label: "Pinterest", href: socialUrl(SETTING_KEYS.SOCIAL_PINTEREST, s(SETTING_KEYS.SOCIAL_PINTEREST)), Icon: FaPinterest },
    { key: "linkedin", label: "LinkedIn", href: socialUrl(SETTING_KEYS.SOCIAL_LINKEDIN, s(SETTING_KEYS.SOCIAL_LINKEDIN)), Icon: FaLinkedinIn },
    { key: "whatsapp", label: "WhatsApp", href: whatsappUrl(phone), Icon: FaWhatsapp },
    { key: "telegram", label: "Telegram", href: socialUrl(SETTING_KEYS.SOCIAL_TELEGRAM, s(SETTING_KEYS.SOCIAL_TELEGRAM)), Icon: FaTelegram },
  ].filter((x) => x.href);

  if (links.length === 0) return null;

  return (
    <div className="w-full h-8 bg-[#166534] flex items-center justify-center gap-5">
      {links.map(({ key, label, href, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/90 hover:text-white transition-colors"
        >
          <span className="sr-only">{label}</span>
          <Icon className="w-3.5 h-3.5" aria-hidden />
        </a>
      ))}
    </div>
  );
}
