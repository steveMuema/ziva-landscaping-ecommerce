import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { action, token, secret } = body;

        const userEmail = session.user.email || "admin@zivalandscaping.co.ke";
        const userId = session.user.id;

        if (action === "generate") {
            // Generate a new pristine cryptographic secret
            const newSecret = speakeasy.generateSecret({
                name: `Ziva Landscaping Admin (${userEmail})`,
            });

            // Paint the QR code onto a data URI to deliver to the React client
            const imageUrl = await qrcode.toDataURL(newSecret.otpauth_url || "");

            return NextResponse.json({ secret: newSecret.base32, qrCodeUrl: imageUrl });
        }

        if (action === "verify") {
            if (!token || !secret) {
                return NextResponse.json({ error: "Missing token or secret" }, { status: 400 });
            }

            // Cryptographically check the 6-digit pin against the HMAC secret
            const isValid = speakeasy.totp.verify({
                secret,
                encoding: "base32",
                token,
            });

            if (!isValid) {
                return NextResponse.json({ error: "Invalid TOTP code. Please try again." }, { status: 400 });
            }

            // If valid, mutate the PostgreSQL record to permanently engage 2FA
            await prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorSecret: secret,
                    twoFactorEnabled: true,
                },
            });

            return NextResponse.json({ success: true });
        }

        if (action === "disable") {
            // Unbind the 2FA cryptographics
            await prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorSecret: null,
                    twoFactorEnabled: false,
                },
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("2FA Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
