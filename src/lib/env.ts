import "server-only";

import type { BillingInterval, PaidPlan } from "@/lib/types";

function read(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export type PaymentProviderName = "dodo" | "stripe";

export type AppEnv = {
  appUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  cronSecret: string;
  resendApiKey: string;
  resendFrom: string;
  pagespeedApiKey: string;
  paymentProvider: PaymentProviderName;
  dodoApiKey: string;
  dodoWebhookKey: string;
  dodoEnvironment: "test_mode" | "live_mode";
  dodoProductSoloMonthly: string;
  dodoProductSoloYearly: string;
  dodoProductStudioMonthly: string;
  dodoProductStudioYearly: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripePriceSoloMonthly: string;
  stripePriceSoloYearly: string;
  stripePriceStudioMonthly: string;
  stripePriceStudioYearly: string;
};

export function readEnv(): AppEnv {
  const provider = read("PAYMENT_PROVIDER").toLowerCase();
  const dodoEnvironment = read("DODO_PAYMENTS_ENVIRONMENT");
  return {
    appUrl: (read("NEXT_PUBLIC_APP_URL") || "http://localhost:3000").replace(/\/$/, ""),
    supabaseUrl: read("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
    cronSecret: read("CRON_SECRET"),
    resendApiKey: read("RESEND_API_KEY"),
    resendFrom: read("RESEND_FROM") || "RetainerSnap <onboarding@resend.dev>",
    pagespeedApiKey: read("PAGESPEED_API_KEY"),
    paymentProvider: provider === "stripe" ? "stripe" : "dodo",
    dodoApiKey: read("DODO_PAYMENTS_API_KEY"),
    dodoWebhookKey: read("DODO_PAYMENTS_WEBHOOK_KEY"),
    dodoEnvironment: dodoEnvironment === "live_mode" ? "live_mode" : "test_mode",
    dodoProductSoloMonthly: read("DODO_PRODUCT_SOLO_MONTHLY"),
    dodoProductSoloYearly: read("DODO_PRODUCT_SOLO_YEARLY"),
    dodoProductStudioMonthly: read("DODO_PRODUCT_STUDIO_MONTHLY"),
    dodoProductStudioYearly: read("DODO_PRODUCT_STUDIO_YEARLY"),
    stripeSecretKey: read("STRIPE_SECRET_KEY"),
    stripeWebhookSecret: read("STRIPE_WEBHOOK_SECRET"),
    stripePriceSoloMonthly: read("STRIPE_PRICE_SOLO_MONTHLY"),
    stripePriceSoloYearly: read("STRIPE_PRICE_SOLO_YEARLY"),
    stripePriceStudioMonthly: read("STRIPE_PRICE_STUDIO_MONTHLY"),
    stripePriceStudioYearly: read("STRIPE_PRICE_STUDIO_YEARLY"),
  };
}

export function missingCoreEnv(): string[] {
  const env = readEnv();
  const missing: string[] = [];
  if (!env.supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!env.supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!env.supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
}

export function hasPublicSupabase(): boolean {
  const env = readEnv();
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function annualConfigured(env = readEnv()): boolean {
  if (env.paymentProvider === "stripe") {
    return Boolean(env.stripePriceSoloYearly && env.stripePriceStudioYearly);
  }
  return Boolean(env.dodoProductSoloYearly && env.dodoProductStudioYearly);
}

export function productIdFor(
  env: AppEnv,
  provider: PaymentProviderName,
  plan: PaidPlan,
  interval: BillingInterval,
): string {
  const table: Record<string, string> = {
    "dodo:solo:month": env.dodoProductSoloMonthly,
    "dodo:solo:year": env.dodoProductSoloYearly,
    "dodo:studio:month": env.dodoProductStudioMonthly,
    "dodo:studio:year": env.dodoProductStudioYearly,
    "stripe:solo:month": env.stripePriceSoloMonthly,
    "stripe:solo:year": env.stripePriceSoloYearly,
    "stripe:studio:month": env.stripePriceStudioMonthly,
    "stripe:studio:year": env.stripePriceStudioYearly,
  };
  const id = table[`${provider}:${plan}:${interval}`] ?? "";
  if (!id) {
    const name =
      provider === "dodo"
        ? `DODO_PRODUCT_${plan.toUpperCase()}_${interval === "month" ? "MONTHLY" : "YEARLY"}`
        : `STRIPE_PRICE_${plan.toUpperCase()}_${interval === "month" ? "MONTHLY" : "YEARLY"}`;
    throw new Error(`Missing ${name}. Create the product, then add the id to your env file.`);
  }
  return id;
}

export function planFromCatalogId(env: AppEnv, catalogId: string | null | undefined): {
  plan: PaidPlan;
  interval: BillingInterval;
} | null {
  if (!catalogId) return null;
  const pairs: Array<[string, PaidPlan, BillingInterval]> = [
    [env.dodoProductSoloMonthly, "solo", "month"],
    [env.dodoProductSoloYearly, "solo", "year"],
    [env.dodoProductStudioMonthly, "studio", "month"],
    [env.dodoProductStudioYearly, "studio", "year"],
    [env.stripePriceSoloMonthly, "solo", "month"],
    [env.stripePriceSoloYearly, "solo", "year"],
    [env.stripePriceStudioMonthly, "studio", "month"],
    [env.stripePriceStudioYearly, "studio", "year"],
  ];
  for (const [id, plan, interval] of pairs) {
    if (id && id === catalogId) return { plan, interval };
  }
  return null;
}
