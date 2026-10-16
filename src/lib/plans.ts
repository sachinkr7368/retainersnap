import type { PaidPlan, PlanId } from "@/lib/types";

export type PlanLimits = {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  sites: number;
  seats: number;
  branding: boolean;
  /** How often uptime is enqueued, in minutes. */
  uptimeIntervalMinutes: number;
  slugHost: boolean;
  blurb: string;
};

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    sites: 2,
    seats: 1,
    branding: false,
    uptimeIntervalMinutes: 60 * 24,
    slugHost: false,
    blurb: "2 sites. Monthly report with a RetainerSnap line at the bottom.",
  },
  solo: {
    id: "solo",
    name: "Solo",
    priceMonthly: 19,
    priceYearly: 190,
    sites: 15,
    seats: 1,
    branding: true,
    uptimeIntervalMinutes: 60 * 24,
    slugHost: false,
    blurb: "15 sites, your logo and colours, daily checks.",
  },
  studio: {
    id: "studio",
    name: "Studio",
    priceMonthly: 49,
    priceYearly: 490,
    sites: 50,
    seats: 3,
    branding: true,
    uptimeIntervalMinutes: 5,
    slugHost: true,
    blurb: "50 sites, checks every 5 minutes, 3 seats, your own report host.",
  },
};

export function subscriptionGrants(
  sub: { status: string; currentPeriodEnd: string | null },
  now = new Date(),
) {
  if (sub.status === "active" || sub.status === "trialing" || sub.status === "past_due") {
    return true;
  }
  if (sub.status === "cancelled" && sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) > now) {
    return true;
  }
  return false;
}

export function resolvePlan(input: {
  trialEndsAt: string | null;
  subscription: { plan: string; status: string; currentPeriodEnd: string | null } | null;
  now?: Date;
}): PlanId {
  const now = input.now ?? new Date();
  const sub = input.subscription;
  if (sub && subscriptionGrants(sub, now) && (sub.plan === "solo" || sub.plan === "studio")) {
    return sub.plan;
  }
  if (input.trialEndsAt && new Date(input.trialEndsAt) > now) return "studio";
  return "free";
}

export function isPaidPlan(plan: string): plan is PaidPlan {
  return plan === "solo" || plan === "studio";
}
