import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFrame } from "@/components/marketing";
import { PrintButton } from "@/components/print-button";
import { ReportDocument } from "@/components/report-document";
import { buttonClass } from "@/components/styles";
import { toReportView } from "@/lib/report-view";

export const metadata: Metadata = { title: "Sample report" };

const report = toReportView({
  studioName: "North Studio",
  logoUrl: null,
  color: "#1f6b45",
  watermark: false,
  footer: "North Studio · care@north.studio",
  clientName: "Harbor Goods",
  hostname: "harbor.example",
  url: "https://harbor.example",
  platform: "webflow",
  periodStart: "2026-10-01",
  summary:
    "harbor.example was up 99.6% of checks in October 2026. SSL is valid through 12 Aug 2027. The domain is registered through 3 Mar 2028. Mobile performance scored 88. One page returned a broken response in the latest crawl.",
  metrics: {
    uptimeRatio: 0.996,
    sslExpiresAt: "2027-08-12T00:00:00.000Z",
    domainExpiresAt: "2028-03-03T00:00:00.000Z",
    registrar: "Example Registrar",
    performance: 88,
    seo: 96,
    accessibility: 91,
    bestPractices: 100,
    lcpMs: 2100,
    inpMs: 140,
    cls: 0.04,
    pagesCrawled: 24,
    broken: [{ url: "https://harbor.example/old-lookbook", status: 404 }],
  },
  items: [
    {
      id: "work-1",
      workspace_id: "demo",
      report_id: "demo",
      kind: "work_done",
      title: "Replaced the hero image and fixed the mobile nav",
      body: "The menu overlapped the announcement bar below 400px.",
      price_cents: null,
      sort: 0,
    },
    {
      id: "next-1",
      workspace_id: "demo",
      report_id: "demo",
      kind: "recommendation",
      title: "Compress the collection pages",
      body: "Largest contentful paint is 2.1s on mobile. A lighter hero would clear it.",
      price_cents: 45000,
      sort: 1,
    },
  ],
});

export default function DemoPage() {
  return (
    <MarketingFrame>
      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.16em] text-muted uppercase">Sample</p>
            <p className="font-serif text-4xl text-ink">What the client receives</p>
          </div>
          <div data-band="demo-actions" className="flex flex-wrap items-center gap-2">
            <PrintButton />
            <Link href="/signup" className={buttonClass}>
              Make one for a client
            </Link>
          </div>
        </div>
        <ReportDocument report={report} />
      </section>
    </MarketingFrame>
  );
}
