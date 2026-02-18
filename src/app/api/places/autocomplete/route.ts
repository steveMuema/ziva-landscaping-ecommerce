import { NextRequest, NextResponse } from "next/server";
import { fetchPlacesAutocomplete } from "@/lib/google-places";

export const dynamic = "force-dynamic";

/** POST: body { input: string, sessionToken?: string }. Uses credentials file for Places API. */
export async function POST(request: NextRequest) {
  try {
    let body: { input?: string; sessionToken?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const input = typeof body?.input === "string" ? body.input.trim() : "";
    if (!input || input.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }
    const suggestions = await fetchPlacesAutocomplete(input, {
      sessionToken: typeof body?.sessionToken === "string" ? body.sessionToken : undefined,
      regionCode: "ke",
    });
    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("POST /api/places/autocomplete error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Autocomplete failed" },
      { status: 500 }
    );
  }
}
