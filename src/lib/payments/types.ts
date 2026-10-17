import type { BillingInterval, PaidPlan } from "@/lib/types";

export type CheckoutInput = {
  workspaceId: string;
  plan: PaidPlan;
  interval: BillingInterval;
  email: string;
  name: string;
};

export type BillingEvent = {
  type: "ignored" | "subscription_changed";
  provider: "dodo" | "stripe";
  eventId: string;
  workspaceId: string | null;
  plan: PaidPlan | null;
  interval: BillingInterval;
  status: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export interface PaymentProvider {
  name: "dodo" | "stripe";
  createCheckout(input: CheckoutInput): Promise<{ url: string }>;
  createPortal(input: { providerCustomerId: string; flow?: "payment_method" }): Promise<{ url: string }>;
  cancelAtPeriodEnd(providerSubscriptionId: string): Promise<void>;
  verifyAndParseWebhook(rawBody: string, headers: Headers): Promise<BillingEvent>;
}
