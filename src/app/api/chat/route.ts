import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/api";
import prisma from "@/lib/prisma";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const maxDuration = 30; // Vercel Edge/Serverless timeout

// ──── Gemini setup ────

const MODEL_NAME = "gemini-2.0-flash";

function getGeminiModel(apiKey: string) {
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
    generationConfig: {
      maxOutputTokens: 300,
      temperature: 0.7,
    },
  });
}

// ──── System prompt builder ────

function buildSystemPrompt(pathname: string, ctx: PageContext, catalogContext: string): string {
  const parts: string[] = [
    `You are Fiona, a friendly, concise customer assistant for Ziva Landscaping Co. — a sustainable landscaping e-commerce site in Kenya, East Africa.`,
    `You help customers navigate the site, find products, understand checkout, delivery, and payment.`,
    `Prices are in KSH (Kenyan Shillings). Payment: M-Pesa (STK push at checkout) or cash on delivery. Orders under 10,000 KSH = full payment; 10,000+ = 50% deposit.`,
    `Stores: Kiambu Rd Ridgeways, Westlands Nairobi, Ngong Nairobi. Phone/WhatsApp: +254 757 133 726. Email: sales@zivalandscaping.co.ke`,
    `Site sections: Shop (product categories), Agriculture (seeds, plants, nursery), Company (mission, vision), Blog.`,
    `Keep answers short (2-4 sentences). Use **bold** for important links/terms. Be warm, natural, helpful.`,
    `If asked something unrelated to Ziva or landscaping, politely redirect.`,
    `CRITICAL: If a user asks a highly specific question, or asks for a product not in the database below, DO NOT INVENT ANYTHING. Simply tell them you are unsure and ask them to use the WhatsApp button below to speak directly with the team.`,
  ];

  // Page context
  parts.push(`\nThe user is currently on: ${pathname}`);
  if (ctx.category) parts.push(`Category: ${ctx.category}`);
  if (ctx.subCategory) parts.push(`Subcategory: ${ctx.subCategory}`);
  if (ctx.productName) parts.push(`Viewing product: "${ctx.productName}" (${ctx.productPrice ? `KSH ${ctx.productPrice}` : "price on page"})`);

  if (catalogContext) {
    parts.push(`\n${catalogContext}`);
    parts.push(`Use the Ziva Knowledge Base above to answer product or stock questions accurately. Do not invent products.`);
  }

  return parts.join("\n");
}

// ──── Types ────

interface PageContext {
  category?: string;
  subCategory?: string;
  productId?: string;
  productName?: string;
  productPrice?: string;
  lastUserMessage?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

// ──── WhatsApp intro (unchanged from before) ────

async function getWhatsAppIntro(pathname: string, ctx: PageContext): Promise<string> {
  const path = (pathname ?? "/").replace(/\/$/, "") || "/";
  const segments = path.split("/").filter(Boolean);
  const { category, subCategory, lastUserMessage } = ctx;

  let baseMsg = "";

  // Product page
  if (segments[0] === "shop" && segments.length === 4) {
    const id = ctx.productId ?? segments[3];
    const product = await getProductById(id);
    const name = product?.name;
    if (name) {
      const breadcrumb =
        category && subCategory ? ` (${category} › ${subCategory})` : category ? ` (${category})` : "";
      baseMsg = `Hi! I was looking at "${name}"${breadcrumb} on your site and had a question — could someone help?`;
    }
  }

  if (!baseMsg && segments[0] === "shop" && segments.length === 3) {
    if (category && subCategory) {
      baseMsg = `Hi! I'm browsing **${subCategory}** under **${category}** on your site — could someone help me out?`;
    } else {
      baseMsg = "Hi! I'm browsing your products and had a quick question — is someone available to help?";
    }
  }

  if (!baseMsg && segments[0] === "shop" && segments.length === 2) {
    const cat = category || segments[1].replace(/-/g, " ");
    baseMsg = `Hi! I'm browsing your **${cat}** section on Ziva Landscaping — could someone help?`;
  }

  if (!baseMsg && path === "/shop") baseMsg = "Hi! I'm on your Shop page and had a question about your products — could someone help me out?";
  if (!baseMsg && path === "/agriculture") baseMsg = "Hi! I was on your Agriculture page and had a question — could someone get back to me?";
  if (!baseMsg && path === "/company") baseMsg = "Hi! I was reading about Ziva and had a question — would someone have a moment to chat?";
  if (!baseMsg && path.startsWith("/blog")) baseMsg = "Hi! I was on your blog and had a question — could someone help?";
  if (!baseMsg && (path === "/" || path === "")) baseMsg = "Hi! I was browsing Ziva Landscaping and had a few questions. Is someone around to chat?";
  if (!baseMsg) baseMsg = "Hi! I'm on your site and had a quick question — would someone be able to help?";

  if (lastUserMessage?.trim()) {
    baseMsg += `\n\nMy question: ${lastUserMessage.trim()}`;
  }

  return baseMsg;
}

// ──── Rule-based fallback (used when Gemini is unavailable) ────

function getContextResponse(pathname: string, message: string): string {
  const m = message.toLowerCase().trim();
  const path = pathname.replace(/\/$/, "") || "/";

  if (/^(hi|hello|hey|good morning|good afternoon)\b/.test(m) || m === "") {
    if (path === "/") return "Hi! I'm Fiona. Welcome to Ziva Landscaping. You're on the home page—I can guide you. Try **Shop** to browse products, **Agriculture** for farm & nursery, or **Company** to learn about us. What would you like to do?";
    if (path === "/shop") return "Hi! I'm Fiona. You're in the Shop. Pick a category below to see products. Need a specific category?";
    if (path.startsWith("/shop/") && path.split("/").length === 3) return "Hi! I'm Fiona. You're viewing a category. Choose a subcategory to see products, or ask me where to find something.";
    if (path.startsWith("/shop/") && path.split("/").length >= 4) return "Hi! I'm Fiona. You're on a product listing. Click any product for details, or add to cart. Need help with checkout or delivery?";
    if (path === "/agriculture") return "Hi! I'm Fiona. You're on Agriculture—seeds, plants, and nursery. Browse categories or ask about organic farming and plants.";
    if (path === "/company") return "Hi! I'm Fiona. You're on our Company page—mission, vision, and Ziva Homes. Want to know about landscaping services?";
    return `Hi! I'm Fiona. You're on ${path === "/" ? "the home page" : "this page"}. How can I guide you? Try: **Shop**, **Agriculture**, **Company**, or **Checkout**.`;
  }

  if (/\b(shop|buy|products?|catalog)\b/.test(m)) return "Go to **Shop** (link in the menu)—then choose a category like Garden Tools, Outdoor Living, Lawn Care. Use the top menu to open Shop.";
  if (/\b(agriculture|farm|plants?|seeds?|nursery)\b/.test(m)) return "Open **Agriculture** from the menu for seeds, seedlings, and plants.";
  if (/\b(company|about|who are you|mission|vision)\b/.test(m)) return "Go to **Company** in the menu for our story, mission, vision, and Ziva Homes.";
  if (/\b(cart|checkout|pay|order|delivery)\b/.test(m)) return "Add products from any product page, then open the **cart** (bag icon). From there go to **Checkout**. We support M-Pesa and cash on delivery.";
  if (/\b(contact|whatsapp|phone|reach)\b/.test(m)) return "Use the **WhatsApp** button below to chat with us, or call +254 757 133 726.";
  if (/\b(price|cost|ksh|payment|mpesa)\b/.test(m)) return "Prices are in KSH. We accept **M-Pesa** (STK push at checkout) and **cash on delivery**.";
  if (/\b(delivery|shipping|location|nairobi|kenya)\b/.test(m)) return "We serve Kenya. At checkout you'll enter your address. Use **WhatsApp** to ask about specific delivery options.";

  return "I'm Fiona, your guide for Ziva Landscaping. Ask: **Where is the shop?**, **How do I checkout?**, **Contact?** or use the menu to explore.";
}

// ──── Gemini AI response ────

async function getGeminiResponse(
  pathname: string,
  message: string,
  ctx: PageContext,
  history: ChatMessage[],
  catalogContext: string,
  apiKey: string
): Promise<string | null> {
  const model = getGeminiModel(apiKey);
  if (!model) return null;

  try {
    const systemPrompt = buildSystemPrompt(pathname, ctx, catalogContext);

    // Build Gemini conversation history
    const geminiHistory = history.map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "System instructions: " + systemPrompt }] },
        { role: "model", parts: [{ text: "Understood! I'm Fiona, ready to help customers navigate Ziva Landscaping. I'll be concise and helpful." }] },
        ...geminiHistory,
      ],
    });

    const result = await chat.sendMessage(message || "Hi, I just opened the chat.");
    const response = result.response;
    return response.text()?.trim() || null;
  } catch (err) {
    console.error("[Gemini] Error:", err);
    return null; // Fall back to rule-based
  }
}

// ──── Fetch product info for context ────

async function enrichContext(pathname: string, ctx: PageContext): Promise<PageContext> {
  const segments = (pathname ?? "/").replace(/\/$/, "").split("/").filter(Boolean);

  if (segments[0] === "shop" && segments.length === 4 && !ctx.productName) {
    const id = ctx.productId ?? segments[3];
    try {
      const product = await getProductById(id);
      if (product) {
        ctx.productName = product.name;
        ctx.productPrice = product.price?.toString();
      }
    } catch { /* ignore */ }
  }

  return ctx;
}

// ──── RAG Catalog Fetcher ────

async function getCatalogContext(): Promise<string> {
  try {
    const [categories, products, blogs] = await Promise.all([
      prisma.category.findMany({ select: { name: true, subCategories: { select: { name: true } } } }),
      prisma.product.findMany({ select: { name: true, price: true }, take: 100 }),
      prisma.blogPost.findMany({ select: { title: true }, take: 15, orderBy: { createdAt: 'desc' } })
    ]);

    let rag = "--- ZIVA KNOWLEDGE BASE ---\n";
    rag += "CATEGORIES: " + categories.map(c => `${c.name} (${c.subCategories.map(s => s.name).join(', ')})`).join(" | ") + "\n";
    rag += "PRODUCTS: " + products.map(p => `${p.name} (KSH ${p.price})`).join(" | ") + "\n";
    rag += "LATEST BLOGS: " + blogs.map(b => b.title).join(" | ") + "\n";
    return rag;
  } catch (e) {
    console.error("RAG Fetch Error:", e);
    return "";
  }
}

// ──── POST handler ────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = (body.message as string) ?? "";
    const pathname = (body.pathname as string) ?? "/";
    const history: ChatMessage[] = body.history ?? [];

    let context: PageContext = {
      category: body.category ?? undefined,
      subCategory: body.subCategory ?? undefined,
      productId: body.productId ?? undefined,
      lastUserMessage: body.lastUserMessage ?? undefined,
    };

    // Enrich with product details if on a product page
    context = await enrichContext(pathname, context);

    // Try Gemini first, fall back to rule-based
    const catalogContext = await getCatalogContext();
    const geminiSetting = await prisma.setting.findUnique({ where: { key: "GEMINI_API_KEY" } });
    const apiKey = geminiSetting?.value?.trim() || process.env.GOOGLE_AI_API_KEY || "";

    let reply = await getGeminiResponse(pathname, message, context, history, catalogContext, apiKey);
    const usedAI = !!reply;
    if (!reply) {
      reply = getContextResponse(pathname, message);
    }

    const whatsappIntro = await getWhatsAppIntro(pathname, context);

    return NextResponse.json({ reply, whatsappIntro, ai: usedAI });
  } catch {
    return NextResponse.json(
      { reply: "Sorry, something went wrong. I'm Fiona—try asking: Where is the shop? Or use the menu to explore.", ai: false },
      { status: 200 }
    );
  }
}
