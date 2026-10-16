"use client";

import { useMutation } from "@tanstack/react-query";
import { buttonClass, buttonSecondary } from "@/components/styles";
import { Alert } from "@/components/ui/alert";
import { readApi } from "@/lib/api-client";
import type { BillingInterval, PaidPlan } from "@/lib/types";

async function startCheckout(input: { plan: PaidPlan; interval: BillingInterval }) {
  const response = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (response.status === 401) {
    window.location.href = "/login?next=/app/billing";
    return "";
  }
  const result = await readApi<{ url: string }>(response);
  if (!result.ok) throw new Error(result.message);
  if (!result.data.url) throw new Error("Checkout could not start.");
  return result.data.url;
}

export function CheckoutButton({
  plan,
  interval,
  label,
  emphasis = false,
}: {
  plan: PaidPlan;
  interval: BillingInterval;
  label: string;
  emphasis?: boolean;
}) {
  const mutation = useMutation({
    mutationFn: startCheckout,
    onSuccess(url) {
      if (url) window.location.href = url;
    },
  });
  const error = mutation.error instanceof Error ? mutation.error.message : "";

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => mutation.mutate({ plan, interval })}
        disabled={mutation.isPending}
        className={`${emphasis ? buttonClass : buttonSecondary} w-full`}
      >
        {mutation.isPending ? "Redirecting…" : label}
      </button>
      {error ? <Alert className="mt-2">{error}</Alert> : null}
    </div>
  );
}
