import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { PaidChoice, PlanChoice } from "@/components/plan-choices";
import { PlanGrid } from "@/components/plan-grid";
import { SubmitButton } from "@/components/submit-button";
import { buttonSecondary } from "@/components/styles";
import { cancelSubscription, openBillingPortal } from "@/lib/actions/billing";
import { annualConfigured, readEnv } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "Billing" };

const messages: Record<string, string> = {
  owner: "Only the workspace owner can change billing.",
  nosub: "There is no customer record yet. Subscribe once, then the billing portal opens.",
  return: "If checkout finished, the plan updates when the webhook arrives. Refresh in a moment.",
  success: "Checkout returned. The plan updates when the webhook arrives.",
  cancel: "Checkout was cancelled. The current plan is unchanged.",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkout?: string }>;
}) {
  const params = await searchParams;
  const { role, billing } = await requireMember();
  const yearly = annualConfigured();
  const provider = readEnv().paymentProvider;
  const notice = messages[params.error ?? ""] || messages[params.checkout ?? ""] || "";
  const subscription = billing.subscription;

  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-4xl">Billing</h1>
      <p className="mt-2 text-sm text-muted">
        Current plan: {billing.limits.name}.
        {billing.trialDaysLeft != null ? ` Studio trial, ${billing.trialDaysLeft} days left.` : ""}
        {subscription
          ? ` ${subscription.provider} · ${subscription.status}${subscription.cancel_at_period_end ? " · cancels at period end" : ""}${subscription.current_period_end ? ` · through ${formatDate(subscription.current_period_end)}` : ""}.`
          : ""}
      </p>
      {notice ? <p className="mt-4 rounded-xl border border-line bg-card px-4 py-3 text-sm">{notice}</p> : null}

      <div className="mt-8">
        <PlanGrid
          actions={{
            free: <PlanChoice label={billing.plan === "free" ? "Current plan" : "Included"} />,
            solo: (
              <PaidChoice
                plan="solo"
                emphasis={false}
                yearly={yearly}
                yearlyLabel="$190 yearly"
                owner={role === "owner"}
                current={billing.plan === "solo"}
              />
            ),
            studio: (
              <PaidChoice
                plan="studio"
                emphasis
                yearly={yearly}
                yearlyLabel="$490 yearly"
                owner={role === "owner"}
                current={billing.plan === "studio"}
              />
            ),
          }}
        />
      </div>

      <p className="mt-4 text-sm text-muted">Product Hunt readers can enter PH50 at checkout for 50% off the first year, when that coupon exists in the payment dashboard.</p>
      <p className="mt-6 text-sm text-muted">
        Checkout is processed by {provider === "dodo" ? "Dodo Payments" : "Stripe"}, the merchant of record for this
        deployment. Prices are USD. Taxes are calculated at checkout.
      </p>

      {role === "owner" && subscription ? (
        <div className="mt-8 flex flex-wrap items-start gap-6">
          <form action={openBillingPortal}>
            <SubmitButton className={buttonSecondary} pendingLabel="Opening…">
              Open billing portal
            </SubmitButton>
          </form>
          <div className="max-w-sm">
            <ActionForm action={cancelSubscription} submit="Cancel at period end" pendingLabel="Scheduling…">
              <p className="text-sm text-muted">Access stays until the current period ends. The webhook confirms the status.</p>
            </ActionForm>
          </div>
        </div>
      ) : null}
      {role !== "owner" ? <p className="mt-6 text-sm text-muted">Ask the workspace owner to change the plan.</p> : null}
    </div>
  );
}
