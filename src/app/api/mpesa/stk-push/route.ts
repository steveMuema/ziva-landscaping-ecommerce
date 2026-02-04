import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const MPESA_ENV = process.env.MPESA_ENV || "sandbox";
const BASE_URL =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

async function getAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new Error("MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET are required");
  }
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
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
    const { orderId, phone, amount } = await request.json();
    if (!orderId || !phone || amount == null) {
      return NextResponse.json(
        { error: "Missing orderId, phone, or amount" },
        { status: 400 }
      );
    }
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const callbackBase =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    if (!shortcode || !passkey) {
      return NextResponse.json(
        { error: "MPESA_SHORTCODE and MPESA_PASSKEY must be set" },
        { status: 500 }
      );
    }
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, "")
      .slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
      "base64"
    );
    const token = await getAccessToken();
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
    const stkRes = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
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
