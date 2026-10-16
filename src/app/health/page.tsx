import type { Metadata } from "next";
import { HealthTool } from "@/components/health-tool";
import { MarketingFrame } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Free site health report",
  description: "Paste a public URL for PageSpeed, SSL expiry, and domain expiry. No account required.",
};

export default async function HealthPage({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  const params = await searchParams;
  return (
    <MarketingFrame>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs tracking-[0.16em] text-moss uppercase">Free tool</p>
        <h1 className="mt-3 font-serif text-5xl">Site health report</h1>
        <p className="mt-4 text-muted">
          One public URL. PageSpeed on mobile, the SSL date from certificate logs, and domain expiry from RDAP. Eight
          checks an hour from the same network, then the signup form is the next step.
        </p>
        <div className="mt-8">
          <HealthTool initialUrl={params.url ?? ""} />
        </div>
      </section>
    </MarketingFrame>
  );
}
