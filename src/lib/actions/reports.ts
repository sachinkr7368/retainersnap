"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fail, invalidAction, succeed } from "@/lib/action-state";
import { loadSiteMetrics } from "@/lib/data";
import { friendlyDbError } from "@/lib/db-error";
import { periodLabel, periodStartIso, dollarsToCents } from "@/lib/format";
import { requireMember } from "@/lib/session";
import { buildSummary } from "@/lib/summary";
import { createAdmin } from "@/lib/supabase/admin";
import type { ActionState, Site } from "@/lib/types";
import { reportItemSchema, summarySchema } from "@/lib/validators";

async function ownedSite(siteId: string, workspaceId: string) {
  const admin = createAdmin();
  const { data, error } = await admin.from("sites").select("*").eq("id", siteId).eq("workspace_id", workspaceId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Site | null) ?? null;
}

export async function generateReport(formData: FormData) {
  const siteId = String(formData.get("site_id") ?? "");
  const { workspace, billing } = await requireMember();
  const site = await ownedSite(siteId, workspace.id);
  if (!site) redirect("/app");
  const period = periodStartIso();
  const admin = createAdmin();
  const { data: existing } = await admin
    .from("monthly_reports")
    .select("id")
    .eq("site_id", site.id)
    .eq("period_start", period)
    .maybeSingle();
  if (existing?.id) redirect(`/app/reports/${existing.id}`);

  const metrics = await loadSiteMetrics(site.id, period);
  const summary = buildSummary({
    hostname: site.hostname,
    periodLabel: periodLabel(period),
    uptimeRatio: metrics.uptimeRatio,
    sslExpiresAt: metrics.sslExpiresAt,
    domainExpiresAt: metrics.domainExpiresAt,
    brokenCount: metrics.broken.length,
    performance: metrics.performance,
  });
  const { data, error } = await admin
    .from("monthly_reports")
    .insert({
      workspace_id: workspace.id,
      client_id: site.client_id,
      site_id: site.id,
      period_start: period,
      summary,
      uptime_ratio: metrics.uptimeRatio,
      brand_name: workspace.name,
      brand_color: workspace.brand_color,
      logo_url: workspace.logo_url,
      show_watermark: !billing.limits.branding,
    })
    .select("id")
    .single();
  if (error || !data) {
    redirect(`/app/sites/${site.id}?error=report`);
  }
  redirect(`/app/reports/${data.id}`);
}

export async function saveSummary(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = summarySchema.safeParse({ summary: formData.get("summary") ?? "" });
  if (!parsed.success) return invalidAction(parsed.error);
  const summary = parsed.data.summary;
  const reportId = String(formData.get("report_id") ?? "");
  const { workspace } = await requireMember();
  const admin = createAdmin();
  const { error } = await admin
    .from("monthly_reports")
    .update({ summary })
    .eq("id", reportId)
    .eq("workspace_id", workspace.id);
  if (error) return fail(friendlyDbError(error.message, "Could not save the summary."));
  revalidatePath(`/app/reports/${reportId}`);
  return succeed("Summary saved.");
}

export async function addReportItem(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = reportItemSchema.safeParse({
    kind: formData.get("kind"),
    title: formData.get("title"),
    body: formData.get("body") ?? "",
    price: formData.get("price") ?? "",
  });
  if (!parsed.success) return invalidAction(parsed.error);
  let price: number | null = null;
  try {
    price = dollarsToCents(parsed.data.price);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Price is not valid.";
    return { error: "", ok: "", fieldErrors: { price: message } };
  }
  const reportId = String(formData.get("report_id") ?? "");
  const { workspace } = await requireMember();
  const admin = createAdmin();
  const { count } = await admin
    .from("report_items")
    .select("id", { count: "exact", head: true })
    .eq("report_id", reportId)
    .eq("workspace_id", workspace.id);
  const { error } = await admin.from("report_items").insert({
    workspace_id: workspace.id,
    report_id: reportId,
    kind: parsed.data.kind,
    title: parsed.data.title,
    body: parsed.data.body || null,
    price_cents: price,
    sort: count ?? 0,
  });
  if (error) return { error: friendlyDbError(error.message, "Could not add that item."), ok: "" };
  revalidatePath(`/app/reports/${reportId}`);
  return { error: "", ok: "Item added." };
}

export async function deleteReportItem(formData: FormData) {
  const reportId = String(formData.get("report_id") ?? "");
  const itemId = String(formData.get("item_id") ?? "");
  const { workspace } = await requireMember();
  const admin = createAdmin();
  await admin.from("report_items").delete().eq("id", itemId).eq("report_id", reportId).eq("workspace_id", workspace.id);
  revalidatePath(`/app/reports/${reportId}`);
}

export async function publishReport(formData: FormData) {
  const reportId = String(formData.get("report_id") ?? "");
  const { workspace, billing } = await requireMember();
  const admin = createAdmin();
  const { data: report } = await admin
    .from("monthly_reports")
    .select("id, site_id, period_start")
    .eq("id", reportId)
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  if (!report) redirect("/app/reports");
  let uptime: number | null = null;
  if (report.site_id) {
    const metrics = await loadSiteMetrics(report.site_id as string, String(report.period_start));
    uptime = metrics.uptimeRatio;
  }
  const { error } = await admin
    .from("monthly_reports")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      uptime_ratio: uptime,
      brand_name: workspace.name,
      brand_color: workspace.brand_color,
      logo_url: workspace.logo_url,
      show_watermark: !billing.limits.branding,
    })
    .eq("id", reportId)
    .eq("workspace_id", workspace.id);
  if (error) redirect(`/app/reports/${reportId}?error=publish`);
  revalidatePath(`/app/reports/${reportId}`);
}

export async function refreshReport(formData: FormData) {
  const reportId = String(formData.get("report_id") ?? "");
  const { workspace } = await requireMember();
  const admin = createAdmin();
  const { data: report } = await admin
    .from("monthly_reports")
    .select("id, site_id, period_start")
    .eq("id", reportId)
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  if (!report?.site_id) redirect("/app/reports");
  const { data: site } = await admin.from("sites").select("hostname").eq("id", report.site_id).maybeSingle();
  const metrics = await loadSiteMetrics(report.site_id as string, String(report.period_start));
  const summary = buildSummary({
    hostname: (site?.hostname as string) ?? "This site",
    periodLabel: periodLabel(String(report.period_start)),
    uptimeRatio: metrics.uptimeRatio,
    sslExpiresAt: metrics.sslExpiresAt,
    domainExpiresAt: metrics.domainExpiresAt,
    brokenCount: metrics.broken.length,
    performance: metrics.performance,
  });
  await admin
    .from("monthly_reports")
    .update({ summary, uptime_ratio: metrics.uptimeRatio })
    .eq("id", reportId)
    .eq("workspace_id", workspace.id);
  revalidatePath(`/app/reports/${reportId}`);
}
