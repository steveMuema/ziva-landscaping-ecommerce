import { getSetting } from "./settings";
import { SETTING_KEYS } from "./setting-keys";

// Zoho Books API requires an OAuth2 access token, which expires in 1 hour.
// We must use the refresh token to get a new access token for each execution
// or cache it, but for simplicity we fetch a fresh one per operation or cache it briefly in memory.

let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

const getZohoConfig = async () => {
    const clientId = await getSetting(SETTING_KEYS.ZOHO_BOOKS_CLIENT_ID);
    const clientSecret = await getSetting(SETTING_KEYS.ZOHO_BOOKS_CLIENT_SECRET);
    const refreshToken = await getSetting(SETTING_KEYS.ZOHO_BOOKS_REFRESH_TOKEN);
    const organizationId = await getSetting(SETTING_KEYS.ZOHO_BOOKS_ORGANIZATION_ID);

    if (!clientId || !clientSecret || !refreshToken || !organizationId) {
        console.warn("Zoho Books API credentials missing in the admin settings configuration.");
    }

    return { clientId, clientSecret, refreshToken, organizationId };
};

async function getAccessToken(): Promise<string> {
    const { clientId, clientSecret, refreshToken } = await getZohoConfig();

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error("Missing Zoho Books OAuth credentials in admin settings");
    }

    // Check if we have a valid cached token (buffer of 60 seconds)
    if (cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
        return cachedAccessToken;
    }

    // The token URL might depend on the domain (e.g. accounts.zoho.eu, accounts.zoho.in)
    // using accounts.zoho.com as default
    const tokenUrl = "https://accounts.zoho.com/oauth/v2/token";

    const params = new URLSearchParams();
    params.append('refresh_token', refreshToken);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'refresh_token');

    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
    });

    const data = await response.json();

    if (!response.ok || data.error) {
        console.error("Zoho token refresh failed:", data);
        throw new Error(`Zoho Token Refresh Error: ${data.error || 'Unknown error'}`);
    }

    cachedAccessToken = data.access_token;
    // expires_in is usually 3600 seconds (1 hour)
    tokenExpiresAt = Date.now() + (data.expires_in * 1000);

    return cachedAccessToken!;
}

// Helper to make Zoho API calls
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function zohoApiCall(endpoint: string, method: string = "GET", body: any = null) {
    const { organizationId } = await getZohoConfig();

    if (!organizationId) {
        throw new Error("Missing Zoho Books Organization ID in admin settings");
    }

    const token = await getAccessToken();
    const baseUrl = "https://www.zohoapis.com/books";

    const url = new URL(`${baseUrl}${endpoint}`);
    url.searchParams.append("organization_id", organizationId);

    const options: RequestInit = {
        method,
        headers: {
            "Authorization": `Zoho-oauthtoken ${token}`,
            "Content-Type": "application/json"
        },
    };

    if (body) {
        // Zoho Books often expects URLSearchParams or JSON strings, but primarily JSON payload
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);
    const data = await response.json();

    if (!response.ok || data.code !== 0) {
        console.error(`Zoho API Error (${endpoint}):`, data);
        throw new Error(`Zoho API Error: ${data.message}`);
    }

    return data;
}

export const ZohoClient = {
    /**
     * Finds an existing customer by email, or creates a new one.
     */
    async syncCustomer(email: string, fullname: string): Promise<string | null> {
        try {
            // 1. Search for existing customer
            const searchData = await zohoApiCall(`/contacts?email=${encodeURIComponent(email)}`);
            if (searchData.contacts && searchData.contacts.length > 0) {
                // Return the first match's ID
                return searchData.contacts[0].contact_id;
            }

            // 2. Create new customer
            const [firstName, ...rest] = fullname.trim().split(" ");
            const lastName = rest.join(" ") || "Customer";

            const createPayload = {
                contact_name: fullname.trim(),
                company_name: "",
                contact_type: "customer",
                contact_persons: [{
                    first_name: firstName,
                    last_name: lastName,
                    email: email
                }]
            };

            const createData = await zohoApiCall("/contacts", "POST", createPayload);
            return createData.contact.contact_id;
        } catch (e) {
            console.error("Zoho Sync Customer Exception:", e);
            return null; // Fallback silently
        }
    },

    /**
     * Creates an invoice in Zoho Books.
     */
    async syncInvoice(customerId: string, items: Array<{ name: string; price: number; quantity: number }>, transportFee: number): Promise<string | null> {
        try {
            const lineItems = items.map((item) => ({
                name: item.name,
                rate: item.price,
                quantity: item.quantity,
                description: "Imported from Storefront Checkout"
            }));

            if (transportFee > 0) {
                lineItems.push({
                    name: "Transport / Delivery Fee",
                    rate: transportFee,
                    quantity: 1,
                    description: "Shipping Cost"
                });
            }

            const payload = {
                customer_id: customerId,
                line_items: lineItems,
                // Optional: you can set custom fields, notes, etc here
                notes: "Thank you for your business."
            };

            const data = await zohoApiCall("/invoices", "POST", payload);
            return data.invoice.invoice_id;
        } catch (e) {
            console.error("Zoho Sync Invoice Exception:", e);
            return null;
        }
    },

    /**
     * Marks the invoice as 'Sent' and optionally emails it via Zoho securely.
     */
    async sendInvoice(invoiceId: string, email: string): Promise<boolean> {
        try {
            // 1. First mark it as sent (this handles the status transition)
            await zohoApiCall(`/invoices/${invoiceId}/status/sent`, "POST");

            // 2. Trigger the email send to the customer
            const payload = {
                to_mail_ids: [email],
                subject: "Your Invoice from Ziva Landscaping",
                body: "Thank you for your order! Please find your official invoice attached."
            };

            await zohoApiCall(`/invoices/${invoiceId}/email`, "POST", payload);
            return true;
        } catch (e) {
            console.error("Zoho Send Invoice Exception:", e);
            return false;
        }
    }
};
