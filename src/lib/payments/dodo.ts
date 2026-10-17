import "server-only";

import DodoPayments from "dodopayments";
import type { Subscription } from "dodopayments/resources/subscriptions";
import { planFromCatalogId, productIdFor, readEnv } from "@/lib/env";
import { isPaidPlan } from "@/lib/plans";
import type { BillingInterval, PaidPlan } from "@/lib/types";
import type { BillingEvent, CheckoutInput, PaymentProvider } from "@/lib/payments/types";

function client() {
  const env = readEnv();
  if (!env.dodoApiKey) throw new Error("Missing DODO_PAYMENTS_API_KEY");
  return new DodoPayments({
    bearerToken: env.dodoApiKey,
    webhookKey: env.dodoWebhookKey || null,
    environment: env.dodoEnvironment,
  });
}

function metaString(metadata: Subscription["metadata"] | undefined, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value ? value : null;
}

function intervalFrom(value: string | null | undefined, fallback: Subscription["payment_frequency_interval"]): BillingInterval {
  if (value === "year" || value === "month") return value;
  return fallback === "Year" ? "year" : "month";
}

export class DodoProvider implements PaymentProvider {
  name = "dodo" as const;

  async createCheckout(input: CheckoutInput): Promise<{ url: string }> {
    const env = readEnv();
    const session = await client().checkoutSessions.create({
      product_cart: [{ product_id: productIdFor(env, "dodo", input.plan, input.interval), quantity: 1 }],
      customer: { email: input.email, name: input.name },
      return_url: `${env.appUrl}/app/billing?checkout=return`,
      cancel_url: `${env.appUrl}/app/billing?checkout=cancel`,
      metadata: {
        workspace_id: input.workspaceId,
        plan: input.plan,
        interval: input.interval,
      },
    });
    if (!session.checkout_url) throw new Error("Dodo did not return a checkout URL.");
    return { url: session.checkout_url };
  }

  async createPortal(input: { providerCustomerId: string; flow?: "payment_method" }): Promise<{ url: string }> {
    const env = readEnv();
    const session = await client().customers.customerPortal.create(input.providerCustomerId, {
      return_url: `${env.appUrl}/app/billing`,
    });
    return { url: session.link };
  }

  async cancelAtPeriodEnd(providerSubscriptionId: string): Promise<void> {
    await client().subscriptions.update(providerSubscriptionId, {
      cancel_at_next_billing_date: true,
    });
  }

  async verifyAndParseWebhook(rawBody: string, headers: Headers): Promise<BillingEvent> {
    const event = client().webhooks.unwrap(rawBody, {
      headers: {
        "webhook-id": headers.get("webhook-id") ?? "",
        "webhook-signature": headers.get("webhook-signature") ?? "",
        "webhook-timestamp": headers.get("webhook-timestamp") ?? "",
      },
    });
    const eventId = headers.get("webhook-id") || `${event.type}:${event.timestamp}`;
    if (!event.type.startsWith("subscription.")) {
      return ignored("dodo", eventId);
    }
    const data = event.data as Subscription;
    if (!data?.subscription_id) return ignored("dodo", eventId);
    return subscriptionEvent("dodo", eventId, data);
  }
}

export function subscriptionEvent(provider: "dodo", eventId: string, data: Subscription): BillingEvent {
  const env = readEnv();
  const fromMeta = metaString(data.metadata, "plan");
  const fromProduct = planFromCatalogId(env, data.product_id);
  const plan: PaidPlan | null = isPaidPlan(fromMeta ?? "") ? (fromMeta as PaidPlan) : fromProduct?.plan ?? null;
  const interval = intervalFrom(metaString(data.metadata, "interval"), data.payment_frequency_interval);
  return {
    type: "subscription_changed",
    provider,
    eventId,
    workspaceId: metaString(data.metadata, "workspace_id"),
    plan,
    interval: fromProduct?.interval ?? interval,
    status: data.status,
    providerCustomerId: data.customer?.customer_id ?? null,
    providerSubscriptionId: data.subscription_id,
    currentPeriodEnd: data.next_billing_date ?? null,
    cancelAtPeriodEnd: Boolean(data.cancel_at_next_billing_date),
  };
}

function ignored(provider: "dodo" | "stripe", eventId: string): BillingEvent {
  return {
    type: "ignored",
    provider,
    eventId,
    workspaceId: null,
    plan: null,
    interval: "month",
    status: "incomplete",
    providerCustomerId: null,
    providerSubscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
}
