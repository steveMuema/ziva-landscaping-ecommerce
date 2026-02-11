import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getConfigValue, SETTING_KEYS } from "@/lib/settings";

function getBaseUrl(env: string) {
  return env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
}

async function getAccessToken(key: string, secret: string, baseUrl: string): Promise<string> {
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`M-Pesa auth failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  if (!data.access_token) throw new Error("No access_token in M-Pesa response");
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const mpesaEnv =
      (await getConfigValue(SETTING_KEYS.MPESA_ENV, "MPESA_ENV")) || "sandbox";
    const baseUrl = getBaseUrl(mpesaEnv);
    const consumerKey = await getConfigValue(SETTING_KEYS.MPESA_CONSUMER_KEY, "MPESA_CONSUMER_KEY");
    const consumerSecret = await getConfigValue(SETTING_KEYS.MPESA_CONSUMER_SECRET, "MPESA_CONSUMER_SECRET");
    const shortcode = await getConfigValue(SETTING_KEYS.MPESA_SHORTCODE, "MPESA_SHORTCODE");
    const passkey = await getConfigValue(SETTING_KEYS.MPESA_PASSKEY, "MPESA_PASSKEY");

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: "M-Pesa Consumer Key and Secret must be set in Settings or environment." },
        { status: 500 }
      );
    }
    if (!shortcode || !passkey) {
      return NextResponse.json(
        { error: "M-Pesa Shortcode and Passkey must be set in Settings or environment." },
        { status: 500 }
      );
    }

    const { orderId, phone, amount } = await request.json();
    if (!orderId || !phone || amount == null) {
      return NextResponse.json(
        { error: "Missing orderId, phone, or amount" },
        { status: 400 }
      );
    }
    const callbackBase =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, "")
      .slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
      "base64"
    );
    const token = await getAccessToken(consumerKey, consumerSecret, baseUrl);
    const phoneFormatted =
      phone.length === 9 ? `254${phone}` : phone.startsWith("254") ? phone : `254${phone}`;
    const callbackUrl = `${callbackBase}/api/mpesa/callback`;
    const body = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: phoneFormatted,
      PartyB: shortcode,
      PhoneNumber: phoneFormatted,
      CallBackURL: callbackUrl,
      AccountReference: `ORD-${orderId}`,
      TransactionDesc: `Ziva Order #${orderId}`,
    };
    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const stkData = await stkRes.json();
    if (!stkRes.ok) {
      return NextResponse.json(
        { error: stkData.errorMessage || stkData.error || "STK push failed" },
        { status: 400 }
      );
    }
    if (stkData.ErrorCode && stkData.ErrorCode !== "0") {
      return NextResponse.json(
        { error: stkData.ErrorMessage || stkData.errorMessage || "STK push failed" },
        { status: 400 }
      );
    }
    const checkoutRequestId = stkData.CheckoutRequestID;
    if (checkoutRequestId) {
      await prisma.mpesaStkRequest.create({
        data: { checkoutRequestId, orderId: Number(orderId), amount },
      });
    }
    return NextResponse.json({
      CheckoutRequestID: checkoutRequestId,
      orderId,
      message: "Enter M-Pesa PIN on your phone to complete payment.",
    });
  } catch (err) {
    console.error("M-Pesa STK push error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "M-Pesa STK push failed",
      },
      { status: 500 }
    );
  }
}
