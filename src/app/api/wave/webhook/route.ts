import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

/**
 * Handles inbound webhook events natively broadcast by Wave Accounting.
 * When an invoice is paid or a transaction is settled inside Wave, this endpoint harvests the payload
 * and mirrors the ledger state back to the local Prisma Order instance.
 */
export async function POST(request: Request) {
    try {
        const payload = await request.json();
        console.log("Wave Webhook Intercept Received Payload:", JSON.stringify(payload, null, 2));

        // Wave webhooks carry event identifiers
        const eventType = payload?.event || payload?.eventType || payload?.type;
        const data = payload?.data || payload;

        // Search for any invoice identifier inside the payload object matrix
        const invoiceId = data?.invoice?.id || data?.invoiceId || data?.invoice_id || data?.id;

        // Attempt to parse loosely structured payment amounts
        const amountPaid = data?.amount || data?.payment?.amount || data?.total;

        if (!invoiceId) {
            console.warn("Wave Webhook discarded: Could not extract an explicit invoiceId from payload.");
            return NextResponse.json({ status: "ignored", reason: "Missing invoice mapping ID" });
        }

        // Locate the matching Order organically via the previously anchored Wave tracking ID
        const orderObj = await prisma.order.findFirst({
            where: { waveInvoiceId: invoiceId }
        });

        if (!orderObj) {
            console.warn(`Wave Webhook mapping failed: No local Order exists for waveInvoiceId [${invoiceId}]`);
            return NextResponse.json({ status: "orphaned", invoiceId });
        }

        // Process the event logic. Assuming payment.created or invoice.paid constitutes clearing the order.
        if (eventType === "payment.created" || eventType === "invoice.updated" || eventType === "invoice.paid") {
            await prisma.order.update({
                where: { id: orderObj.id },
                data: {
                    status: "COMPLETED",
                    amountPaid: amountPaid ? Number(amountPaid) : orderObj.subtotal + (orderObj.transportFee || 0), // Default to full price if exact amount not parsed
                }
            });
            console.log(`Successfully mapped Wave payment -> Order #${orderObj.id} is now COMPLETED.`);
        }

        revalidatePath("/admin/finance");
        revalidatePath(`/admin/orders/${orderObj.id}`);

        return NextResponse.json({ status: "success", mappedOrderId: orderObj.id });
    } catch (err) {
        console.error("Critical Wave Webhook Exception:", err);
        return NextResponse.json({ error: "Internal Server Mapping Fault" }, { status: 500 });
    }
}
