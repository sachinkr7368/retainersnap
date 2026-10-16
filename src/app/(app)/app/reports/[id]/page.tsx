import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLink } from "@/components/copy-link";
import { ReportItemForm, SummaryForm } from "@/components/forms";
import { PrintButton } from "@/components/print-button";
import { ReportDocument } from "@/components/report-document";
import { SubmitButton } from "@/components/submit-button";
import { buttonSecondary } from "@/components/styles";
import { deleteReportItem, publishReport, refreshReport } from "@/lib/actions/reports";
import { loadSiteMetrics, reportBundle } from "@/lib/data";
import { readEnv } from "@/lib/env";
import { emptyMetrics, toReportView } from "@/lib/report-view";
import { requireMember } from "@/lib/session";
import { appOrigin } from "@/lib/urls";

export const metadata: Metadata = { title: "Edit report" };

export default async function ReportEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { workspace, billing } = await requireMember();
  const bundle = await reportBundle(id, workspace.id);
  if (!bundle) notFound();

  const metrics = bundle.site ? await loadSiteMetrics(bundle.site.id, bundle.report.period_start) : emptyMetrics;
  const view = toReportView({
    studioName: workspace.name,
    logoUrl: billing.limits.branding ? workspace.logo_url : null,
    color: workspace.brand_color,
    watermark: !billing.limits.branding,
    footer: workspace.report_footer,
    clientName: bundle.client?.name || "Client",
    hostname: bundle.site?.hostname || "Site",
    url: bundle.site?.url || "",
    platform: bundle.site?.platform || "",
    periodStart: bundle.report.period_start,
    summary: bundle.report.summary,
    metrics: { ...metrics, uptimeRatio: bundle.report.uptime_ratio ?? metrics.uptimeRatio },
    items: bundle.items,
  });
  const share = `${appOrigin(readEnv().appUrl, workspace.slug, billing.limits.slugHost)}/r/${bundle.report.share_token}`;

  return (
    <div className="grid gap-8">
      <header className="no-print flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/app/reports" className="text-sm text-muted underline">
            Reports
          </Link>
          <p className="mt-3 font-serif text-4xl text-ink">
            {view.clientName} · {view.period}
          </p>
          <p className="mt-2 text-sm text-muted">
            {bundle.report.status === "published" ? "Published" : "Draft"}. The watermark follows the live plan, so a
            downgrade puts the RetainerSnap line back.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          {bundle.report.status === "published" ? <CopyLink url={share} /> : null}
          <form action={refreshReport}>
            <input type="hidden" name="report_id" value={bundle.report.id} />
            <SubmitButton className={buttonSecondary} pendingLabel="Refreshing…">
              Refresh summary
            </SubmitButton>
          </form>
          <form action={publishReport}>
            <input type="hidden" name="report_id" value={bundle.report.id} />
            <SubmitButton pendingLabel="Publishing…">
              {bundle.report.status === "published" ? "Update published report" : "Publish"}
            </SubmitButton>
          </form>
        </div>
      </header>
      {query.error === "publish" ? <p className="text-sm text-clay">Publishing failed. Try again.</p> : null}
      {bundle.report.status === "published" ? (
        <p className="no-print text-sm text-muted">
          Share link: <a href={share}>{share}</a>
        </p>
      ) : (
        <p className="no-print text-sm text-muted">Publish to turn on the share link. Until then the public page stays hidden.</p>
      )}

      <section className="no-print grid gap-8 lg:grid-cols-2">
        <SummaryForm reportId={bundle.report.id} summary={bundle.report.summary} />
        <div>
          <h2 className="font-serif text-2xl">Add an item</h2>
          <div className="mt-3">
            <ReportItemForm reportId={bundle.report.id} />
          </div>
          <ul className="mt-4 grid gap-2">
            {bundle.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm">
                <span>
                  <span className="text-xs tracking-wide text-muted uppercase">{item.kind === "work_done" ? "Work" : "Next"}</span>
                  <p>{item.title}</p>
                </span>
                <form action={deleteReportItem}>
                  <input type="hidden" name="report_id" value={bundle.report.id} />
                  <input type="hidden" name="item_id" value={item.id} />
                  <button type="submit" className="text-xs text-clay underline">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ReportDocument report={view} />
    </div>
  );
}
