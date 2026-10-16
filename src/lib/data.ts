import "server-only";

import { asBroken } from "@/lib/checks/links";
import { createAdmin } from "@/lib/supabase/admin";
import type { CheckRun, Client, LinkCheck, MonthlyReport, PagespeedSnapshot, ReportItem, Site } from "@/lib/types";

export type ReportMetrics = {
  uptimeRatio: number | null;
  uptimeSamples: number;
  sslExpiresAt: string | null;
  domainExpiresAt: string | null;
  registrar: string | null;
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  lcpMs: number | null;
  inpMs: number | null;
  cls: number | null;
  broken: { url: string; status: number | null; error?: string }[];
  pagesCrawled: number;
};

export async function loadSiteMetrics(siteId: string, periodStart: string): Promise<ReportMetrics> {
  const admin = createAdmin();
  const [uptime, ssl, domain, speed, links] = await Promise.all([
    admin
      .from("check_runs")
      .select("ok")
      .eq("site_id", siteId)
      .eq("kind", "uptime")
      .gte("created_at", `${periodStart}T00:00:00Z`),
    admin
      .from("check_runs")
      .select("ok, expires_at, detail, created_at")
      .eq("site_id", siteId)
      .eq("kind", "ssl")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("check_runs")
      .select("ok, expires_at, detail, created_at")
      .eq("site_id", siteId)
      .eq("kind", "domain")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("pagespeed_snapshots")
      .select("performance, seo, accessibility, best_practices, lcp_ms, inp_ms, cls, created_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("link_checks")
      .select("pages_crawled, broken, created_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  for (const result of [uptime, ssl, domain, speed, links]) {
    if (result.error) throw new Error(result.error.message);
  }
  const samples = uptime.data ?? [];
  const okCount = samples.filter((row) => row.ok).length;
  const sslRow = ssl.data as Pick<CheckRun, "expires_at" | "detail"> | null;
  const domainRow = domain.data as Pick<CheckRun, "expires_at" | "detail"> | null;
  const speedRow = speed.data as PagespeedSnapshot | null;
  const linkRow = links.data as Pick<LinkCheck, "pages_crawled" | "broken"> | null;
  const registrar = domainRow?.detail && typeof domainRow.detail.registrar === "string" ? domainRow.detail.registrar : null;
  return {
    uptimeRatio: samples.length ? okCount / samples.length : null,
    uptimeSamples: samples.length,
    sslExpiresAt: sslRow?.expires_at ?? null,
    domainExpiresAt: domainRow?.expires_at ?? null,
    registrar,
    performance: speedRow?.performance ?? null,
    seo: speedRow?.seo ?? null,
    accessibility: speedRow?.accessibility ?? null,
    bestPractices: speedRow?.best_practices ?? null,
    lcpMs: speedRow?.lcp_ms ?? null,
    inpMs: speedRow?.inp_ms ?? null,
    cls: speedRow?.cls ?? null,
    broken: asBroken(linkRow?.broken),
    pagesCrawled: linkRow?.pages_crawled ?? 0,
  };
}

export async function workspaceSites(workspaceId: string) {
  const admin = createAdmin();
  const { data, error } = await admin
    .from("sites")
    .select("*, clients(id, name)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<Site & { clients: Pick<Client, "id" | "name"> | null }>;
}

export async function workspaceClients(workspaceId: string) {
  const admin = createAdmin();
  const { data, error } = await admin
    .from("clients")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}

export async function reportBundle(reportId: string, workspaceId: string) {
  const admin = createAdmin();
  const { data: report, error } = await admin
    .from("monthly_reports")
    .select("*")
    .eq("id", reportId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!report) return null;
  const [{ data: items }, { data: site }, { data: client }] = await Promise.all([
    admin.from("report_items").select("*").eq("report_id", reportId).order("sort", { ascending: true }),
    report.site_id
      ? admin.from("sites").select("*").eq("id", report.site_id).maybeSingle()
      : Promise.resolve({ data: null }),
    report.client_id
      ? admin.from("clients").select("*").eq("id", report.client_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return {
    report: report as MonthlyReport,
    items: (items ?? []) as ReportItem[],
    site: (site as Site | null) ?? null,
    client: (client as Client | null) ?? null,
  };
}
