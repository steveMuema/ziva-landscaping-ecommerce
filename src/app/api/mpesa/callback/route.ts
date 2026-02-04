import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

/**
 * Safaricom M-Pesa STK Push callback. Called when customer completes or cancels payment.
 * On success: look up order by CheckoutRequestID and update amountPaid and mpesaReceiptNo.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = body?.Body?.stkCallback;
    if (!result) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid payload" });
    }
    const resultCode = result.ResultCode;
    const callbackMeta = result.CallbackMetadata;
    const checkoutRequestId = result.CheckoutRequestId;

    if (resultCode !== 0) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    let amount = 0;
    let mpesaReceiptNo: string | null = null;
    if (Array.isArray(callbackMeta?.Item)) {
      for (const item of callbackMeta.Item) {
        if (item.Name === "Amount") amount = Number(item.Value) || 0;
        if (item.Name === "MpesaReceiptNumber") mpesaReceiptNo = String(item.Value || "");
      }
    }

    const stkRecord = await prisma.mpesaStkRequest.findUnique({
      where: { checkoutRequestId },
    });
    const orderId = stkRecord?.orderId;
    if (!orderId) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        amountPaid: amount,
        mpesaReceiptNo,
        status: "PROCESSING",
      },
    });

    revalidatePath("/admin/finance");
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (err) {
    console.error("M-Pesa callback error:", err);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
