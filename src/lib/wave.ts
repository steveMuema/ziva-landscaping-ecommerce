export const WAVE_API_URL = "https://gql.waveapps.com/graphql/public";

// Safely access environment variables
const getWaveConfig = () => {
    const token = process.env.WAVE_ACCESS_TOKEN;
    const businessId = process.env.WAVE_BUSINESS_ID;
    if (!token || !businessId) {
        console.warn("Wave Accounting API credentials missing in environment variable configuration.");
    }
    return { token, businessId };
};

/**
 * Generic GraphQL Query Engine for Wave Accounting.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function waveGraphQL(query: string, variables: any = {}) {
    const { token } = getWaveConfig();
    if (!token) throw new Error("WAVE_ACCESS_TOKEN is inherently missing");

    const response = await fetch(WAVE_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, variables }),
    });

    const json = await response.json();
    if (json.errors) {
        console.error("Wave GraphQL Errored Response:", JSON.stringify(json.errors, null, 2));
        throw new Error(`Wave API Error: ${json.errors[0]?.message}`);
    }

    return json.data;
}

export const WaveClient = {
    /**
     * Orchestrates the materialization of a Wave Customer record.
     */
    async syncCustomer(email: string, fullname: string) {
        const { businessId } = getWaveConfig();
        const [firstName, ...rest] = fullname.trim().split(" ");
        const lastName = rest.join(" ") || "Customer";

        const query = `
      mutation CreateCustomer($input: CustomerCreateInput!) {
        customerCreate(input: $input) {
          didSucceed
          inputErrors { message path }
          customer { id }
        }
      }
    `;

        const variables = {
            input: {
                businessId,
                firstName,
                lastName,
                email,
            },
        };

        try {
            const data = await waveGraphQL(query, variables);
            if (data?.customerCreate?.didSucceed) {
                return data.customerCreate.customer.id;
            } else {
                console.error("Failed to create Wave customer:", data?.customerCreate?.inputErrors);
                return null; // Fallback silently to prevent checkout breakage
            }
        } catch (e) {
            console.error("Wave Sync Customer Exception:", e);
            return null;
        }
    },

    /**
     * Translates the eCommerce cart and freight constraints into a formalized Draft Invoice.
     */
    async syncInvoice(customerId: string, items: Array<{ name: string; price: number; quantity: number }>, transportFee: number) {
        const { businessId } = getWaveConfig();

        const lineItems = items.map((item) => ({
            description: item.name,
            unitPrice: item.price,
            quantity: item.quantity,
        }));

        if (transportFee > 0) {
            lineItems.push({
                description: "Transport / Delivery Fee",
                unitPrice: transportFee,
                quantity: 1,
            });
        }

        const query = `
      mutation CreateInvoice($input: InvoiceCreateInput!) {
        invoiceCreate(input: $input) {
          didSucceed
          inputErrors { message path }
          invoice { id }
        }
      }
    `;

        const variables = {
            input: {
                businessId,
                customerId,
                status: "SAVED", // Create as saved so we can immediately log payments against it
                items: lineItems,
            },
        };

        try {
            const data = await waveGraphQL(query, variables);
            if (data?.invoiceCreate?.didSucceed) {
                return data.invoiceCreate.invoice.id;
            } else {
                console.error("Failed to map invoice in Wave:", data?.invoiceCreate?.inputErrors);
                return null;
            }
        } catch (e) {
            console.error("Wave Sync Invoice Exception:", e);
            return null;
        }
    },

    /**
     * Approves an invoice, locking it from drafted editing sequences.
     */
    async approveInvoice(invoiceId: string) {
        const query = `
      mutation ApproveInvoice($input: InvoiceApproveInput!) {
        invoiceApprove(input: $input) {
          didSucceed
        }
      }
    `;
        return waveGraphQL(query, { input: { invoiceId } });
    },

    /**
     * Instructs Wave Accounting to finalize and securely email the invoice + payment gateway URL directly to the user.
     * This fully offloads collection to the native Wave infrastructure.
     */
    async sendInvoice(invoiceId: string, email: string) {
        const query = `
      mutation SendInvoice($input: InvoiceSendInput!) {
        invoiceSend(input: $input) {
          didSucceed
          inputErrors { message path }
        }
      }
    `;

        const variables = {
            input: {
                invoiceId,
                to: [email],
                subject: "Your Invoice from Ziva Landscaping",
                message: "Thank you for your order! Please find your official invoice and a secure payment link attached to finalize your purchase.",
            },
        };

        try {
            const data = await waveGraphQL(query, variables);
            if (!data?.invoiceSend?.didSucceed) {
                console.error("Failed to instruct Wave to send the email invoice:", data?.invoiceSend?.inputErrors);
            }
            return data?.invoiceSend?.didSucceed;
        } catch (e) {
            console.error("Wave Send Invoice Exception Engine:", e);
            return false;
        }
    }
};
