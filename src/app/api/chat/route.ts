import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

function getContextResponse(pathname: string, message: string): string {
  const m = message.toLowerCase().trim();
  const path = pathname.replace(/\/$/, "") || "/";

  // Greetings
  if (/^(hi|hello|hey|good morning|good afternoon)\b/.test(m) || m === "") {
    if (path === "/") return "Hi! I'm Fiona. Welcome to Ziva Landscaping. You're on the home page—I can guide you. Try **Shop** to browse products, **Agriculture** for farm & nursery, or **Company** to learn about us. What would you like to do?";
    if (path === "/shop") return "Hi! I'm Fiona. You're in the Shop. Pick a category below (e.g. Garden Tools, Outdoor Living, Lawn Care) to see products. Need a specific category?";
    if (path.startsWith("/shop/") && path.split("/").length === 3) return "Hi! I'm Fiona. You're viewing a category. Choose a subcategory to see products, or ask me where to find something.";
    if (path.startsWith("/shop/") && path.split("/").length >= 4) return "Hi! I'm Fiona. You're on a product listing. Click any product for details, or add to cart. Need help with checkout or delivery?";
    if (path === "/agriculture") return "Hi! I'm Fiona. You're on Agriculture—seeds, plants, and nursery. Browse categories or ask about organic farming and plants.";
    if (path === "/company") return "Hi! I'm Fiona. You're on our Company page—mission, vision, and Ziva Homes. Want to know about landscaping services or BNB?";
    if (path === "/blog") return "Hi! I'm Fiona. You're on the Blog. Browse posts below. Need help finding something else on the site?";
    return `Hi! I'm Fiona. You're on ${path === "/" ? "the home page" : "this page"}. How can I guide you? Try: **Shop**, **Agriculture**, **Company**, or **Checkout**.`;
  }

  // Navigation / where to go
  if (/\b(shop|buy|products?|catalog)\b/.test(m)) return "Go to **Shop** (link in the menu)—then choose a category like Garden Tools, Outdoor Living, Lawn Care, or Home Decor. I see you're on the site; use the top menu to open Shop.";
  if (/\b(agriculture|farm|plants?|seeds?|nursery)\b/.test(m)) return "Open **Agriculture** from the menu for seeds, seedlings, and plants. You can also find some under Shop → Plants & Nursery.";
  if (/\b(company|about|who are you|mission|vision)\b/.test(m)) return "Go to **Company** in the menu for our story, mission, vision, and Ziva Homes.";
  if (/\b(blog|articles?|posts?)\b/.test(m)) return "Open **Blog** in the menu to read our latest posts.";
  if (/\b(cart|checkout|pay|order|delivery)\b/.test(m)) return "Add products from any product page, then open the **cart** (bag icon in the header). From there you can go to **Checkout**. We support M-Pesa and cash on delivery.";
  if (/\b(contact|whatsapp|phone|reach)\b/.test(m)) return "Use the **WhatsApp** button (bottom right) to chat with us, or call/WhatsApp the number on the site. We're here to help!";
  if (/\b(help|guide|lost)\b/.test(m)) {
    if (path === "/") return "You're on the home page. Use the menu: **Shop** (products), **Agriculture** (plants & seeds), **Company** (about us), **Blog**. Or tell me what you're looking for.";
    if (path.startsWith("/shop")) return "You're in the Shop. Pick a category, then a subcategory, then a product. Use the cart icon to checkout. Need something specific?";
    return "Use the top menu to go to **Shop**, **Agriculture**, **Company**, or **Blog**. Tell me what you want to do and I'll point you there.";
  }

  // Contextual hints based on current page
  if (path === "/" && /\b(what|where|how)\b/.test(m)) return "You're on the home page. Scroll to see collections, or use the menu: **Shop** (products), **Agriculture**, **Company**, **Blog**. What do you want to find?";
  if (path === "/shop" && (/\b(categor|find|look)\b/.test(m) || m.length < 20)) return "On this page you'll see all categories (e.g. Garden Tools, Lawn Care, Home Decor). Click one to see subcategories and products.";
  if (path.startsWith("/shop/") && /\b(product|item|buy)\b/.test(m)) return "You're in a category. Click a subcategory to see products, then click a product to view details and add to cart.";
  if (/\b(price|cost|ksh|payment|mpesa)\b/.test(m)) return "Prices are in KSH. We accept **M-Pesa** (STK push at checkout) and **cash on delivery**. Orders under 10,000 KSH require full payment; 10,000+ require 50% deposit.";
  if (/\b(delivery|shipping|location|nairobi|kenya)\b/.test(m)) return "We serve Kenya and can discuss delivery. At checkout you'll enter your address. For exact delivery options, use the **WhatsApp** button to ask the team.";

  // Default
  return "I'm Fiona, your guide for Ziva Landscaping. I see where you are on the site. You can ask: **Where is the shop?**, **How do I checkout?**, **Contact?**, or **What's on this page?**—or use the menu to explore.";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = (body.message as string) ?? "";
    const pathname = (body.pathname as string) ?? "/";

    const reply = getContextResponse(pathname, message);

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { reply: "Sorry, something went wrong. I'm Fiona—try asking: Where is the shop? Or use the menu to explore." },
      { status: 200 }
    );
  }
}
