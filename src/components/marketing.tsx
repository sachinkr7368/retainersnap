import Link from "next/link";
import { hasPublicSupabase, readEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  let email: string | null = null;
  if (hasPublicSupabase()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      email = data.user?.email ?? null;
    } catch {
      email = null;
    }
  }

  return (
    <header className="no-print border-b border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
        <Link href="/" className="font-serif text-xl tracking-tight">
          RetainerSnap
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link href="/health" className="text-muted hover:text-ink">
            Free check
          </Link>
          <Link href="/pricing" className="text-muted hover:text-ink">
            Pricing
          </Link>
          <Link href="/demo" className="hidden text-muted hover:text-ink sm:inline">
            Sample report
          </Link>
          {email ? (
            <Link href="/app" className="inline-flex h-9 items-center rounded-full bg-ink px-3 text-paper">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="inline-flex h-9 items-center rounded-full bg-ink px-3 text-paper">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm text-muted">
        <p>Monthly client reports for Framer, Webflow, and Next.js retainers.</p>
        <p>Payments are processed by {readEnv().paymentProvider === "stripe" ? "Stripe" : "Dodo Payments"}.</p>
      </div>
    </footer>
  );
}

export async function MarketingFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-frame flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
