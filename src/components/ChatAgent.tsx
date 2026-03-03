"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { SETTING_KEYS } from "@/lib/setting-keys";
import { slugToName } from "@/lib/slug";

const DEFAULT_WHATSAPP = "254757133726";

/** Normalize to digits with country code for wa.me (e.g. 254712345678). */
function normalizeWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) return "254" + digits;
  if (digits.length >= 10 && digits.startsWith("254")) return digits.slice(0, 12);
  if (digits.length >= 9) return "254" + digits.slice(-9);
  return value || DEFAULT_WHATSAPP;
}

/** Parse the pathname into structured, human-readable page context. */
function parsePageContext(pathname: string): {
  category?: string;
  subCategory?: string;
  productId?: string;
} {
  const segments = (pathname ?? "/")
    .replace(/\/$/, "")
    .split("/")
    .filter(Boolean);

  // /shop/category/subcategory/id
  if (segments[0] === "shop" && segments.length >= 4) {
    return {
      category: slugToName(segments[1]),
      subCategory: slugToName(segments[2]),
      productId: segments[3],
    };
  }
  // /shop/category/subcategory
  if (segments[0] === "shop" && segments.length === 3) {
    return {
      category: slugToName(segments[1]),
      subCategory: slugToName(segments[2]),
    };
  }
  // /shop/category
  if (segments[0] === "shop" && segments.length === 2) {
    return { category: slugToName(segments[1]) };
  }
  // /agriculture/category/subcategory/id  or /agriculture/category/subcategory etc.
  if (segments[0] === "agriculture" && segments.length >= 3) {
    return {
      category: slugToName(segments[1]),
      subCategory: segments[2] ? slugToName(segments[2]) : undefined,
      productId: segments[3] ?? undefined,
    };
  }
  if (segments[0] === "agriculture" && segments.length === 2) {
    return { category: slugToName(segments[1]) };
  }
  return {};
}

type Message = { role: "user" | "assistant"; text: string };

export default function ChatAgent() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [introFetched, setIntroFetched] = useState(false);
  const [introLoading, setIntroLoading] = useState(false);
  const [whatsappIntro, setWhatsappIntro] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>(DEFAULT_WHATSAPP);
  const [whatsappDisplay, setWhatsappDisplay] = useState<string>("+254 757 133 726");
  const listEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((data) => {
        const raw = (data[SETTING_KEYS.SITE_PHONE_WHATSAPP] ?? "").trim();
        if (raw) {
          setWhatsappNumber(normalizeWhatsApp(raw));
          setWhatsappDisplay(raw);
        }
      })
      .catch(() => { });
  }, []);

  const scrollToBottom = () => listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setIntroFetched(false);
    setMessages([]);
    setWhatsappIntro(null); // New page = fresh WhatsApp intro
  }, [pathname]);

  // When panel opens, fetch context-aware intro (page/product) as first message
  useEffect(() => {
    if (!open || introFetched || messages.length > 0) return;
    setIntroFetched(true);
    setIntroLoading(true);
    const ctx = parsePageContext(pathname ?? "/");
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "", pathname: pathname ?? "/", ...ctx, history: [] }),
    })
      .then((res) => res.json())
      .then((data) => {
        const reply = (data.reply as string)?.trim();
        const intro = (data.whatsappIntro as string)?.trim();
        if (reply) setMessages([{ role: "assistant", text: reply }]);
        if (intro) setWhatsappIntro(intro);
      })
      .catch(() => { })
      .finally(() => setIntroLoading(false));
  }, [open, introFetched, pathname, messages.length]);

  async function sendMessage(text?: string) {
    const toSend = (text ?? input).trim();
    if (!toSend) return;

    setInput("");
    const updatedMessages = [...messages, { role: "user" as const, text: toSend }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const ctx = parsePageContext(pathname ?? "/");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: toSend,
          pathname: pathname ?? "/",
          ...ctx,
          history: updatedMessages.slice(0, -1), // everything before the current message
        }),
      });
      const data = await res.json();
      const reply = (data.reply as string) ?? "I'm here to guide you. Try: Where is the shop? How do I checkout?";
      // Update the WhatsApp intro with the latest context (including user message)
      const intro = (data.whatsappIntro as string)?.trim();
      if (intro) setWhatsappIntro(intro);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "I couldn't respond right now. Use the menu to explore, or open WhatsApp below to contact us." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Don't show on admin or auth pages
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) return null;

  function openWhatsAppWithContext() {
    // Find the last message the user typed, to append to the WhatsApp intro
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.text;

    let intro =
      whatsappIntro ||
      (pathname === "/" || !pathname
        ? "Hi! I was browsing Ziva Landscaping and had a few questions. Is someone around to chat?"
        : "Hi! I'm on your site and had a quick question — would someone be able to help?");

    // If the user typed something in chat but the intro doesn't already include it, append it
    if (lastUserMsg && !intro.includes(lastUserMsg)) {
      intro += `\n\nMy question: ${lastUserMsg}`;
    }

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(intro)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {/* Toggle button — bottom-right (replaces WhatsApp button) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg transition-all hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
        aria-label={open ? "Close Chat" : "Chat with us"}
      >
        {open ? <XMarkIcon className="h-6 w-6" /> : <ChatBubbleLeftRightIcon className="h-6 w-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-40 flex w-[min(calc(100vw-3rem),380px)] flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-xl"
          aria-label="Chat with us"
        >
          <div className="border-b border-[var(--card-border)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Assistant</h2>
            <p className="text-xs text-[var(--muted)]">I see where you are. Ask me anything, or contact us below.</p>
          </div>

          <div className="flex max-h-[340px] min-h-[200px] flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && introLoading && (
                <p className="text-sm text-[var(--muted)]">Loading context…</p>
              )}
              {messages.length === 0 && !introLoading && !loading && (
                <p className="text-sm text-[var(--muted)]">Say **Hi** or ask: Where is the shop? How do I checkout?</p>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${msg.role === "user"
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--card-border)]/50 text-[var(--foreground)]"
                      }`}
                  >
                    {/* Simple **bold** rendering */}
                    {msg.role === "assistant" ? (
                      <span className="whitespace-pre-wrap">
                        {msg.text.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                          part.startsWith("**") && part.endsWith("**") ? (
                            <strong key={j}>{part.slice(2, -2)}</strong>
                          ) : (
                            part
                          )
                        )}
                      </span>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-[var(--card-border)]/50 px-3 py-2 text-sm text-[var(--muted)]">
                    …
                  </div>
                </div>
              )}
              <div ref={listEndRef} />
            </div>

            <form
              className="flex gap-2 border-t border-[var(--card-border)] p-3"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything…"
                className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                Send
              </button>
            </form>

            {/* Contact: WhatsApp with page/product context as intro */}
            <div className="border-t border-[var(--card-border)] px-4 py-3">
              <p className="text-xs font-medium text-[var(--muted)] mb-1">Contact us</p>
              <button
                type="button"
                onClick={openWhatsAppWithContext}
                className="flex w-full items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--card-border)]/30 transition-colors"
              >
                <Image src="/whatsapp.svg" alt="" width={22} height={22} />
                <span>{whatsappDisplay}</span>
                <span className="ml-auto text-xs text-[var(--muted)]">Opens with your message</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
