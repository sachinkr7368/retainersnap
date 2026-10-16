import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { ReportDocument } from "@/components/report-document";
import { SetupRequired } from "@/components/setup-required";
import { loadSiteMetrics } from "@/lib/data";
import { missingCoreEnv } from "@/lib/env";
import { emptyMetrics, toReportView } from "@/lib/report-view";
import { loadBilling } from "@/lib/session";
import { createAdmin } from "@/lib/supabase/admin";
import type { Client, MonthlyReport, ReportItem, Site, Workspace } from "@/lib/types";

export const metadata: Metadata = { title: "Report" };

export default async function PublicReportPage({ params }: { params: Promise<{ token: string }> }) {
  const missing = missingCoreEnv();
  if (missing.length) return <SetupRequired missing={missing} />;

  const { token } = await params;
  const admin = createAdmin();
  const { data, error } = await admin
    .from("monthly_reports")
    .select("*")
    .eq("share_token", token)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) notFound();
  const report = data as MonthlyReport;

  const [{ data: items }, { data: site }, { data: client }, { data: workspace }] = await Promise.all([
    admin.from("report_items").select("*").eq("report_id", report.id).order("sort", { ascending: true }),
    report.site_id ? admin.from("sites").select("*").eq("id", report.site_id).maybeSingle() : Promise.resolve({ data: null }),
    report.client_id ? admin.from("clients").select("*").eq("id", report.client_id).maybeSingle() : Promise.resolve({ data: null }),
    admin.from("workspaces").select("*").eq("id", report.workspace_id).maybeSingle(),
  ]);
  if (!workspace) notFound();

  const siteRow = (site as Site | null) ?? null;
  const metrics = siteRow ? await loadSiteMetrics(siteRow.id, report.period_start) : { ...emptyMetrics, uptimeRatio: report.uptime_ratio };
  const billing = await loadBilling(workspace as Workspace);
  const view = toReportView({
    studioName: report.brand_name || (workspace as Workspace).name,
    logoUrl: billing.limits.branding ? report.logo_url || (workspace as Workspace).logo_url : null,
    color: report.brand_color || (workspace as Workspace).brand_color,
    watermark: !billing.limits.branding,
    footer: (workspace as Workspace).report_footer,
    clientName: (client as Client | null)?.name || "Client",
    hostname: siteRow?.hostname || "Site",
    url: siteRow?.url || "",
    platform: siteRow?.platform || "",
    periodStart: report.period_start,
    summary: report.summary,
    metrics,
    items: (items ?? []) as ReportItem[],
  });

  return (
    <main className="px-4 py-8 md:px-6 md:py-12">
      <div className="no-print mx-auto mb-4 flex max-w-3xl justify-end">
        <PrintButton />
      </div>
      <ReportDocument report={view} />
    </main>
  );
}
