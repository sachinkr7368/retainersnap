"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/format";
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
  const { url } = await provider.createPortal({
    providerCustomerId: subscription.provider_customer_id,
    flow: "payment_method",
  });
  redirect(url);
}

export async function cancelSubscription(_state: ActionState, _formData: FormData): Promise<ActionState> {
  const { role, billing, workspace } = await requireMember();
  if (role !== "owner") return { error: "Only the workspace owner can change billing.", ok: "" };
  const subscription = billing.granting ?? billing.subscription;
  if (!subscription) return { error: "There is no paid subscription to cancel.", ok: "" };
  const when = formatDate(subscription.current_period_end);
  if (subscription.cancel_at_period_end) {
    return { error: "", ok: `This plan already cancels on ${when}. You keep it until then.` };
  }
  const provider = getPaymentProvider(subscription.provider);
  await provider.cancelAtPeriodEnd(subscription.provider_subscription_id);
  const admin = createAdmin();
  const { error } = await admin
    .from("subscriptions")
    .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
    .eq("workspace_id", workspace.id)
    .eq("provider_subscription_id", subscription.provider_subscription_id);
  if (error) return { error: "The cancellation could not be saved. Try again.", ok: "" };
  revalidatePath("/app/billing");
  return { error: "", ok: `This plan cancels on ${when}. You keep it until that date.` };
}
