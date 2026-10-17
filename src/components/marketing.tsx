import { SiteFrame, type PaymentName } from "@/components/site-chrome";
import { hasPublicSupabase, readEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

async function headerEmail(): Promise<string | null> {
  if (!hasPublicSupabase()) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function MarketingFrame({ children }: { children: React.ReactNode }) {
  const provider: PaymentName = readEnv().paymentProvider;
  return (
    <SiteFrame email={await headerEmail()} provider={provider}>
      {children}
    </SiteFrame>
  );
}
