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

function CurrentPlan({ label }: { label: string }) {
  return (
    <span className="inline-flex h-11 w-full items-center justify-center rounded-full border border-line text-sm text-ink">
      {label}
    </span>
  );
}

export function PaidChoice({
  plan,
  emphasis,
  yearly,
  yearlyLabel,
  owner,
  current,
  currentInterval,
  cancelOn,
}: {
  plan: PaidPlan;
  emphasis: boolean;
  yearly: boolean;
  yearlyLabel: string;
  owner: boolean;
  current: boolean;
  currentInterval?: "month" | "year" | null;
  cancelOn?: string;
}) {
  if (!owner) {
    return <PlanChoice label={current ? "Current plan" : "Owner manages this"} />;
  }
  const onMonth = current && currentInterval !== "year";
  const onYear = current && currentInterval === "year";
  const monthLabel = current && cancelOn ? `Cancels ${cancelOn}` : onMonth ? "Current plan" : "Subscribe monthly";
  return (
    <div className="grid gap-2">
      {onMonth || (current && cancelOn) ? (
        <CurrentPlan label={monthLabel} />
      ) : (
        <CheckoutButton plan={plan} interval="month" label={monthLabel} emphasis={emphasis} />
      )}
      {yearly ? (
        onYear ? (
          <CurrentPlan label="Current plan" />
        ) : (
          <CheckoutButton plan={plan} interval="year" label={yearlyLabel} />
        )
      ) : (
        <span className="h-11" aria-hidden="true" />
      )}
    </div>
  );
}
