import { copyFileSync, existsSync } from "node:fs";
import Stripe from "stripe";
import { upsertEnv } from "./env-file";

const live = process.argv.includes("--live");
const key = process.env.STRIPE_SECRET_KEY ?? "";
if (!key) {
  console.error("STRIPE_SECRET_KEY is missing. Run pnpm stripe:bootstrap so the Stripe CLI key is loaded.");
  process.exit(1);
}
if (live && key.startsWith("sk_test")) {
  console.error("Refusing --live with a test secret key.");
  process.exit(1);
}
if (!live && key.startsWith("sk_live")) {
  console.error("Refusing to create test prices with a live secret key. Pass --live to set up production.");
  process.exit(1);
}

const stripe = new Stripe(key);

const catalog = [
  { plan: "solo", interval: "month", env: "STRIPE_PRICE_SOLO_MONTHLY", amount: 1900, name: "RetainerSnap Solo", recurring: "month" },
  { plan: "solo", interval: "year", env: "STRIPE_PRICE_SOLO_YEARLY", amount: 19000, name: "RetainerSnap Solo", recurring: "year" },
  { plan: "studio", interval: "month", env: "STRIPE_PRICE_STUDIO_MONTHLY", amount: 4900, name: "RetainerSnap Studio", recurring: "month" },
  { plan: "studio", interval: "year", env: "STRIPE_PRICE_STUDIO_YEARLY", amount: 49000, name: "RetainerSnap Studio", recurring: "year" },
] as const;

async function productFor(plan: "solo" | "studio", name: string) {
  const products = await stripe.products.list({ active: true, limit: 100 });
  const existing = products.data.find((product) => product.metadata.retainersnap_plan === plan);
  if (existing) return existing;
  return stripe.products.create({
    name,
    description:
      plan === "solo"
        ? "15 sites, your logo and colours, daily checks."
        : "50 sites, checks every 5 minutes, 3 seats, your report host.",
    metadata: { retainersnap_plan: plan },
  });
}

async function priceFor(productId: string, item: (typeof catalog)[number]) {
  const lookupKey = `retainersnap_${item.plan}_${item.interval}`;
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  const found = existing.data[0];
  if (found && found.unit_amount === item.amount && found.recurring?.interval === item.recurring) return found;
  return stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: item.amount,
    recurring: { interval: item.recurring },
    lookup_key: lookupKey,
    transfer_lookup_key: true,
    metadata: { retainersnap_plan: item.plan, retainersnap_interval: item.interval },
  });
}

async function ensureCoupon() {
  try {
    await stripe.coupons.retrieve("PH50");
  } catch {
    await stripe.coupons.create({
      id: "PH50",
      name: "Product Hunt",
      percent_off: 50,
      duration: "repeating",
      duration_in_months: 12,
    });
  }
  const codes = await stripe.promotionCodes.list({ code: "PH50", limit: 1 });
  if (codes.data.length > 0) return;
  await stripe.promotionCodes.create({
    code: "PH50",
    promotion: { type: "coupon", coupon: "PH50" },
  });
}

async function ensurePortal() {
  const configs = await stripe.billingPortal.configurations.list({ limit: 1 });
  if (configs.data.length > 0) return;
  await stripe.billingPortal.configurations.create({
    business_profile: { headline: "Manage your RetainerSnap plan" },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
    },
  });
}

async function main() {
  const products = {
    solo: await productFor("solo", "RetainerSnap Solo"),
    studio: await productFor("studio", "RetainerSnap Studio"),
  };

  const envValues: Record<string, string> = {
    PAYMENT_PROVIDER: "stripe",
    STRIPE_SECRET_KEY: key,
  };
  for (const item of catalog) {
    const price = await priceFor(products[item.plan].id, item);
    envValues[item.env] = price.id;
    console.log(`${item.env}=${price.id}`);
  }

  await ensureCoupon();
  await ensurePortal();
  console.log("Coupon PH50 is ready. Checkout accepts it.");
  console.log(live ? "Live catalog updated." : "Test catalog updated.");

  const target = live ? ".env.production" : ".env.local";
  if (!existsSync(target) && existsSync(".env.example")) copyFileSync(".env.example", target);
  upsertEnv(target, envValues);
  console.log(`Wrote price ids and PAYMENT_PROVIDER to ${target}. The secret key stayed in that file only.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Stripe bootstrap failed";
  console.error(message);
  process.exit(1);
});
