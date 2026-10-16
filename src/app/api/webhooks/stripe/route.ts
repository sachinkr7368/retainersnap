import { apiError, apiOk } from "@/lib/http";
import { getPaymentProvider } from "@/lib/payments";
import { applyBillingEvent } from "@/lib/payments/sync";
import { isWebhookAuthError } from "@/lib/payments/webhook-error";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!request.headers.get("stripe-signature")) {
    return apiError("invalid_signature", "Invalid webhook signature.", 401);
  }
  const rawBody = await request.text();
  try {
    const event = await getPaymentProvider("stripe").verifyAndParseWebhook(rawBody, request.headers);
    await applyBillingEvent(event);
    return apiOk({ received: true });
  } catch (error) {
    if (isWebhookAuthError(error)) {
      return apiError("invalid_signature", "Invalid webhook signature.", 401);
    }
    return apiError("webhook_failed", "Webhook failed.", 500);
  }
}
