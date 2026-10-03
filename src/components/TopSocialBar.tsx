"use client";

import { useEffect, useState } from "react";
import { FaFacebookF, FaInstagram, FaXTwitter, FaTiktok, FaPinterest, FaLinkedinIn, FaWhatsapp, FaTelegram } from "react-icons/fa6";
import { SETTING_KEYS } from "@/lib/setting-keys";
import { socialUrl, socialPlaceholderUrl, whatsappUrl } from "@/lib/socials";

type SiteSettings = Record<string, string>;

function resolve(key: string, value: string) {
  const configured = socialUrl(key, value);
  return configured ? { href: configured, configured: true } : { href: socialPlaceholderUrl(key), configured: false };
}

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
    { key: "facebook", label: "Facebook", ...resolve(SETTING_KEYS.SOCIAL_FACEBOOK, s(SETTING_KEYS.SOCIAL_FACEBOOK)), Icon: FaFacebookF },
    { key: "instagram", label: "Instagram", ...resolve(SETTING_KEYS.SOCIAL_INSTAGRAM, s(SETTING_KEYS.SOCIAL_INSTAGRAM)), Icon: FaInstagram },
    { key: "twitter", label: "X (Twitter)", ...resolve(SETTING_KEYS.SOCIAL_TWITTER, s(SETTING_KEYS.SOCIAL_TWITTER)), Icon: FaXTwitter },
    { key: "tiktok", label: "TikTok", ...resolve(SETTING_KEYS.SOCIAL_TIKTOK, s(SETTING_KEYS.SOCIAL_TIKTOK)), Icon: FaTiktok },
    { key: "pinterest", label: "Pinterest", ...resolve(SETTING_KEYS.SOCIAL_PINTEREST, s(SETTING_KEYS.SOCIAL_PINTEREST)), Icon: FaPinterest },
    { key: "linkedin", label: "LinkedIn", ...resolve(SETTING_KEYS.SOCIAL_LINKEDIN, s(SETTING_KEYS.SOCIAL_LINKEDIN)), Icon: FaLinkedinIn },
    { key: "whatsapp", label: "WhatsApp", href: whatsappUrl(phone), configured: true, Icon: FaWhatsapp },
    { key: "telegram", label: "Telegram", ...resolve(SETTING_KEYS.SOCIAL_TELEGRAM, s(SETTING_KEYS.SOCIAL_TELEGRAM)), Icon: FaTelegram },
  ];

  return (
    <div className="w-full h-8 bg-[#166534] flex items-center justify-center gap-5">
      {links.map(({ key, label, href, configured, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={configured ? label : `${label} (not yet configured)`}
          className={`transition-colors ${configured ? "text-white/90 hover:text-white" : "text-white/40 hover:text-white/70"}`}
        >
          <span className="sr-only">{label}</span>
          <Icon className="w-3.5 h-3.5" aria-hidden />
        </a>
      ))}
    </div>
  );
}
