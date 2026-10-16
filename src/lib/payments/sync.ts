import "server-only";

import { createAdmin } from "@/lib/supabase/admin";
import { isPaidPlan } from "@/lib/plans";
import type { BillingEvent } from "@/lib/payments/types";

const STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "cancelled",
  "expired",
  "on_hold",
  "failed",
  "incomplete",
]);

export function normalizeStatus(status: string): string {
  const value = status.toLowerCase();
  if (value === "canceled") return "cancelled";
  if (value === "unpaid") return "past_due";
  if (value === "paused") return "on_hold";
  if (value === "pending") return "incomplete";
  if (STATUSES.has(value)) return value;
  return "incomplete";
}

export async function applyBillingEvent(event: BillingEvent) {
  const admin = createAdmin();
  const { data: existing } = await admin
    .from("webhook_events")
    .select("event_id")
    .eq("provider", event.provider)
    .eq("event_id", event.eventId)
    .maybeSingle();
  if (existing) return { duplicate: true };

  if (event.type === "subscription_changed" && event.providerSubscriptionId && event.workspaceId) {
    let plan = event.plan;
    if (!plan) {
      const { data } = await admin
        .from("subscriptions")
        .select("plan")
        .eq("provider", event.provider)
        .eq("provider_subscription_id", event.providerSubscriptionId)
        .maybeSingle();
      if (data && isPaidPlan(data.plan as string)) plan = data.plan as BillingEvent["plan"];
    }
    if (plan) {
      const { error } = await admin.from("subscriptions").upsert(
        {
          workspace_id: event.workspaceId,
          provider: event.provider,
          provider_customer_id: event.providerCustomerId,
          provider_subscription_id: event.providerSubscriptionId,
          plan,
          interval: event.interval,
          status: normalizeStatus(event.status),
          current_period_end: event.currentPeriodEnd,
          cancel_at_period_end: event.cancelAtPeriodEnd,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "provider,provider_subscription_id" },
      );
      if (error) throw new Error(error.message);
    }
  }

  const { error: eventError } = await admin.from("webhook_events").insert({
    provider: event.provider,
    event_id: event.eventId,
  });
  if (eventError && eventError.code !== "23505") throw new Error(eventError.message);
  return { duplicate: false };
}
