"use server";

import { redirect } from "next/navigation";
import { getPaymentProvider } from "@/lib/payments";
import { requireMember } from "@/lib/session";
import { createAdmin } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/types";

export async function openBillingPortal(): Promise<void> {
  const { role, billing } = await requireMember();
  if (role !== "owner") redirect("/app/billing?error=owner");
  const subscription = billing.granting ?? billing.subscription;
  if (!subscription?.provider_customer_id) redirect("/app/billing?error=nosub");
  const provider = getPaymentProvider(subscription.provider);
  const { url } = await provider.createPortal({ providerCustomerId: subscription.provider_customer_id });
  redirect(url);
}

export async function cancelSubscription(_state: ActionState, _formData: FormData): Promise<ActionState> {
  const { role, billing, workspace } = await requireMember();
  if (role !== "owner") return { error: "Only the workspace owner can change billing.", ok: "" };
  const subscription = billing.granting ?? billing.subscription;
  if (!subscription) return { error: "There is no paid subscription to cancel.", ok: "" };
  const provider = getPaymentProvider(subscription.provider);
  await provider.cancelAtPeriodEnd(subscription.provider_subscription_id);
  const admin = createAdmin();
  await admin
    .from("subscriptions")
    .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
    .eq("workspace_id", workspace.id)
    .eq("provider_subscription_id", subscription.provider_subscription_id);
  return { error: "", ok: "Cancellation is scheduled for the end of the current period." };
}
