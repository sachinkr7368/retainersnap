import "server-only";

import Stripe from "stripe";
import { planFromCatalogId, productIdFor, readEnv } from "@/lib/env";
import { isPaidPlan } from "@/lib/plans";
import type { BillingInterval, PaidPlan } from "@/lib/types";
import type { BillingEvent, CheckoutInput, PaymentProvider } from "@/lib/payments/types";

function client() {
  const env = readEnv();
  if (!env.stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(env.stripeSecretKey);
}

function ignored(eventId: string): BillingEvent {
  return {
    type: "ignored",
    provider: "stripe",
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

function customerId(customer: Stripe.Subscription["customer"]): string | null {
  if (typeof customer === "string") return customer;
  if (customer && "id" in customer && !("deleted" in customer && customer.deleted)) return customer.id;
  return null;
}

function fromSubscription(eventId: string, subscription: Stripe.Subscription, ended = false): BillingEvent {
  const env = readEnv();
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const fromPrice = planFromCatalogId(env, priceId);
  const metaPlan = subscription.metadata.plan;
  const plan: PaidPlan | null = isPaidPlan(metaPlan) ? metaPlan : fromPrice?.plan ?? null;
  const metaInterval = subscription.metadata.interval;
  const interval: BillingInterval =
    metaInterval === "year" || metaInterval === "month" ? metaInterval : fromPrice?.interval ?? "month";
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return {
    type: "subscription_changed",
    provider: "stripe",
    eventId,
    workspaceId: subscription.metadata.workspace_id || null,
    plan,
    interval,
    status: ended ? "expired" : subscription.status,
    providerCustomerId: customerId(subscription.customer),
    providerSubscriptionId: subscription.id,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || (subscription.cancel_at != null && subscription.cancel_at * 1000 > Date.now()),
  };
}

export class StripeProvider implements PaymentProvider {
  name = "stripe" as const;

  async createCheckout(input: CheckoutInput): Promise<{ url: string }> {
    const env = readEnv();
    const session = await client().checkout.sessions.create({
      mode: "subscription",
      customer_email: input.email,
      line_items: [{ price: productIdFor(env, "stripe", input.plan, input.interval), quantity: 1 }],
      success_url: `${env.appUrl}/app/billing?checkout=success`,
      cancel_url: `${env.appUrl}/app/billing?checkout=cancel`,
      allow_promotion_codes: true,
      metadata: {
        workspace_id: input.workspaceId,
        plan: input.plan,
        interval: input.interval,
      },
      subscription_data: {
        metadata: {
          workspace_id: input.workspaceId,
          plan: input.plan,
          interval: input.interval,
        },
      },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { url: session.url };
  }

  async createPortal(input: { providerCustomerId: string; flow?: "payment_method" }): Promise<{ url: string }> {
    const env = readEnv();
    const session = await client().billingPortal.sessions.create({
      customer: input.providerCustomerId,
      return_url: `${env.appUrl}/app/billing`,
      ...(input.flow === "payment_method" ? { flow_data: { type: "payment_method_update" } } : {}),
    });
    return { url: session.url };
  }

  async cancelAtPeriodEnd(providerSubscriptionId: string): Promise<void> {
    await client().subscriptions.update(providerSubscriptionId, { cancel_at_period_end: true });
  }

  async verifyAndParseWebhook(rawBody: string, headers: Headers): Promise<BillingEvent> {
    const env = readEnv();
    if (!env.stripeWebhookSecret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    const signature = headers.get("stripe-signature");
    if (!signature) throw new Error("Missing stripe-signature");
    const event = client().webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
    const stripe = client();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (!subscriptionId) return ignored(event.id);
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (session.metadata?.workspace_id && !subscription.metadata.workspace_id) {
        subscription.metadata = { ...subscription.metadata, ...session.metadata };
      }
      return fromSubscription(event.id, subscription);
    }

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      return fromSubscription(event.id, event.data.object as Stripe.Subscription);
    }

    if (event.type === "customer.subscription.deleted") {
      return fromSubscription(event.id, event.data.object as Stripe.Subscription, true);
    }

    return ignored(event.id);
  }
}
