import { getGoogleCredentials } from "@/lib/settings";
import { JWT } from "google-auth-library";

const PLACES_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

/** Get an access token using the uploaded credentials (service account). Returns null if credentials are missing or invalid. */
export async function getGoogleAccessToken(): Promise<string | null> {
  const creds = await getGoogleCredentials();
  if (!creds || typeof creds.client_email !== "string" || typeof creds.private_key !== "string") {
    return null;
  }
  try {
    const client = new JWT({
      email: creds.client_email as string,
      key: (creds.private_key as string).replace(/\\n/g, "\n"),
      scopes: [PLACES_SCOPE],
    });
    const token = await client.getAccessToken();
    return token.token ?? null;
  } catch {
    return null;
  }
}

const PLACES_AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";

export interface AutocompleteSuggestion {
  text: string;
  placeId?: string;
}

/**
 * Call Places API (New) autocomplete using credentials file. Returns display strings for suggestions.
 */
export async function fetchPlacesAutocomplete(
  input: string,
  options?: { sessionToken?: string; regionCode?: string }
): Promise<AutocompleteSuggestion[]> {
  const token = await getGoogleAccessToken();
  if (!token) return [];

  const body: Record<string, unknown> = {
    input: input.trim(),
    includedRegionCodes: options?.regionCode ? [options.regionCode] : ["ke"],
  };
  if (options?.sessionToken) body.sessionToken = options.sessionToken;

  const res = await fetch(PLACES_AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Places autocomplete error:", res.status, err);
    return [];
  }

  const data = (await res.json()) as {
    suggestions?: Array<{
      placePrediction?: { text?: { text?: string }; placeId?: string };
      queryPrediction?: { text?: { text?: string } };
    }>;
  };

  const suggestions: AutocompleteSuggestion[] = [];
  for (const s of data.suggestions ?? []) {
    if (s.placePrediction) {
      const text = s.placePrediction.text?.text?.trim();
      if (text) suggestions.push({ text, placeId: s.placePrediction.placeId });
    } else if (s.queryPrediction) {
      const text = s.queryPrediction.text?.text?.trim();
      if (text) suggestions.push({ text });
    }
  }
  return suggestions;
}
