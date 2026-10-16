import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFrame } from "@/components/marketing";
import { PlanGrid } from "@/components/plan-grid";
import { buttonClass, buttonSecondary } from "@/components/styles";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <MarketingFrame>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="font-serif text-5xl">Simple plans for a retainer practice</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Start on Studio for 14 days. No card. When the trial ends, the workspace drops to the free plan unless you
          subscribe.
        </p>
        <div className="mt-10">
          <PlanGrid
            actions={{
              free: (
                <Link href="/signup" className={buttonSecondary}>
                  Create a free account
                </Link>
              ),
              solo: (
                <Link href="/signup?next=/app/billing" className={buttonSecondary}>
                  Choose Solo
                </Link>
              ),
              studio: (
                <Link href="/signup?next=/app/billing" className={buttonClass}>
                  Choose Studio
                </Link>
              ),
            }}
          />
        </div>
        <p className="mt-8 max-w-3xl text-sm leading-6 text-muted">
          The 14-day Studio trial does not need a card. Prices are in USD. Taxes are calculated at checkout. Yearly
          billing is two months free and is chosen on the billing page. A third client, or dropping the watermark, is
          the usual reason to leave Free.
        </p>
      </section>
    </MarketingFrame>
  );
}
