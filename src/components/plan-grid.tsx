import type { ReactNode } from "react";
import { PLANS, type PlanLimits } from "@/lib/plans";
import type { PlanId } from "@/lib/types";

const order = [PLANS.free, PLANS.solo, PLANS.studio] as const;

function features(plan: PlanLimits): string[] {
  return [
    `${plan.sites} sites`,
    `${plan.seats} ${plan.seats === 1 ? "seat" : "seats"}`,
    plan.branding ? "Your logo and colours" : "Powered by RetainerSnap on reports",
    plan.uptimeIntervalMinutes <= 5 ? "Uptime every 5 minutes" : "Uptime once a day",
  ];
}

export function PlanGrid({ actions }: { actions: Record<PlanId, ReactNode> }) {
  return (
    <div
      data-plan-grid
      className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3 md:grid-rows-[auto_auto_auto_1fr_auto]"
    >
      {order.map((plan) => (
        <article
          key={plan.id}
          data-plan-card={plan.id}
          className="flex h-full flex-col rounded-3xl border border-line bg-card p-6 md:grid md:grid-rows-subgrid md:row-span-5"
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-3xl">{plan.name}</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  plan.id === "studio" ? "bg-moss text-paper" : "invisible max-md:hidden"
                }`}
              >
                14-day trial
              </span>
            </div>
            <p className="mt-3 font-serif text-4xl leading-none">
              {plan.priceMonthly === 0 ? "$0" : `$${plan.priceMonthly}`}
              <span className="font-sans text-base font-normal text-muted"> / month</span>
            </p>
            <p className="mt-2 text-sm text-muted">
              {plan.priceYearly > 0 ? `$${plan.priceYearly} a year, two months free.` : "Free forever."}
            </p>
          </div>
          <p className="mt-4 text-sm leading-6">{plan.blurb}</p>
          <ul data-plan-features className="mt-4 grid gap-2 text-sm text-muted">
            {features(plan).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="min-h-4 flex-1" aria-hidden="true" />
          <div data-plan-action className="w-full [&_a]:w-full [&_button]:w-full">
            {actions[plan.id]}
          </div>
        </article>
      ))}
    </div>
  );
}
