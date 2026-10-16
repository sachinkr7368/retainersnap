import { CheckoutButton } from "@/components/checkout-button";
import type { PaidPlan } from "@/lib/types";

export function PlanChoice({ label }: { label: string }) {
  return (
    <div className="grid gap-2">
      <span className="inline-flex h-11 w-full items-center justify-center rounded-full border border-line text-sm text-muted">
        {label}
      </span>
      <span className="h-11" aria-hidden="true" />
    </div>
  );
}

export function PaidChoice({
  plan,
  emphasis,
  yearly,
  yearlyLabel,
  owner,
  current,
}: {
  plan: PaidPlan;
  emphasis: boolean;
  yearly: boolean;
  yearlyLabel: string;
  owner: boolean;
  current: boolean;
}) {
  if (!owner) {
    return <PlanChoice label={current ? "Current plan" : "Owner manages this"} />;
  }
  return (
    <div className="grid gap-2">
      <CheckoutButton plan={plan} interval="month" label={current ? "Current plan · monthly" : "Subscribe monthly"} emphasis={emphasis} />
      {yearly ? <CheckoutButton plan={plan} interval="year" label={yearlyLabel} /> : <span className="h-11" aria-hidden="true" />}
    </div>
  );
}
