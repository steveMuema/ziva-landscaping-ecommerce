import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Public config for client. Google is credentials-only (no API key). */
export async function GET() {
  return NextResponse.json(
    {},
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
