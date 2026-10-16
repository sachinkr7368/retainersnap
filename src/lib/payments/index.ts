import "server-only";

import { readEnv, type PaymentProviderName } from "@/lib/env";
import { DodoProvider } from "@/lib/payments/dodo";
import { StripeProvider } from "@/lib/payments/stripe";
import type { PaymentProvider } from "@/lib/payments/types";

export function getPaymentProvider(name?: PaymentProviderName): PaymentProvider {
  const chosen = name ?? readEnv().paymentProvider;
  if (chosen === "stripe") return new StripeProvider();
  return new DodoProvider();
}
