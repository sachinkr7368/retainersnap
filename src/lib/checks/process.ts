import "server-only";

import { maybeAlert, clearAlert } from "@/lib/alerts";
import { fetchPage, asBroken } from "@/lib/checks/links";
import { runPagespeed } from "@/lib/checks/pagespeed";
import { runRdap } from "@/lib/checks/rdap";
import { runSsl } from "@/lib/checks/ssl";
import { runUptime } from "@/lib/checks/uptime";
import { readEnv } from "@/lib/env";
import { createAdmin, type AdminClient } from "@/lib/supabase/admin";
import type { BrokenLink, JobKind, Site } from "@/lib/types";

const SSL_ALERT_MS = 14 * 24 * 60 * 60 * 1000;
const DOMAIN_ALERT_MS = 30 * 24 * 60 * 60 * 1000;
const CRAWL_CAP = 50;

type JobRow = {
  id: string;
  workspace_id: string;
  site_id: string;
  kind: JobKind;
  url: string | null;
  payload: Record<string, unknown> | null;
  attempts: number;
};

type CrawlState = {
  queue: string[];
  seen: string[];
  broken: BrokenLink[];
  pages: number;
};

function asState(value: unknown): CrawlState {
  const row = value && typeof value === "object" ? (value as Partial<CrawlState>) : {};
  return {
    queue: Array.isArray(row.queue) ? row.queue.filter((item) => typeof item === "string") : [],
    seen: Array.isArray(row.seen) ? row.seen.filter((item) => typeof item === "string") : [],
    broken: asBroken(row.broken),
    pages: typeof row.pages === "number" ? row.pages : 0,
  };
}

async function loadSite(admin: AdminClient, siteId: string): Promise<Site | null> {
  const { data, error } = await admin.from("sites").select("*").eq("id", siteId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Site | null) ?? null;
}

async function finish(admin: AdminClient, jobId: string) {
  const { error } = await admin
    .from("check_jobs")
    .update({ status: "done", last_error: null, locked_at: null })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}

async function fail(admin: AdminClient, job: JobRow, message: string) {
  const permanent = message.includes("is not set") || job.attempts >= 3;
  const { error } = await admin
    .from("check_jobs")
    .update({
      status: permanent ? "failed" : "pending",
      last_error: message.slice(0, 500),
      locked_at: null,
      run_after: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    .eq("id", job.id);
  if (error) throw new Error(error.message);
}

async function handleUptime(admin: AdminClient, site: Site) {
  const result = await runUptime(site.url);
  const { error } = await admin.from("check_runs").insert({
    workspace_id: site.workspace_id,
    site_id: site.id,
    kind: "uptime",
    ok: result.ok,
    status_code: result.statusCode,
    latency_ms: result.latencyMs,
    detail: result.error ? { error: result.error } : {},
  });
  if (error) throw new Error(error.message);
  await admin.from("sites").update({ last_uptime_at: new Date().toISOString() }).eq("id", site.id);
  if (result.ok) await clearAlert(admin, site, "down");
  else await maybeAlert(admin, site, "down", `${site.hostname} did not respond OK${result.statusCode ? ` (HTTP ${result.statusCode})` : ""}.`);
}

async function handleSsl(admin: AdminClient, site: Site) {
  const result = await runSsl(site.hostname);
  const { error } = await admin.from("check_runs").insert({
    workspace_id: site.workspace_id,
    site_id: site.id,
    kind: "ssl",
    ok: result.ok,
    expires_at: result.expiresAt,
    detail: { issuer: result.issuer, error: result.error ?? null },
  });
  if (error) throw new Error(error.message);
  await admin.from("sites").update({ last_ssl_at: new Date().toISOString() }).eq("id", site.id);
  const expires = result.expiresAt ? new Date(result.expiresAt).getTime() : null;
  if (expires != null && expires - Date.now() < SSL_ALERT_MS) {
    await maybeAlert(admin, site, "ssl", `SSL for ${site.hostname} expires on ${result.expiresAt}.`);
  } else if (result.ok) {
    await clearAlert(admin, site, "ssl");
  }
}

async function handleDomain(admin: AdminClient, site: Site) {
  const result = await runRdap(site.hostname);
  const { error } = await admin.from("check_runs").insert({
    workspace_id: site.workspace_id,
    site_id: site.id,
    kind: "domain",
    ok: result.ok,
    expires_at: result.expiresAt,
    detail: { registrar: result.registrar, domain: result.domain, error: result.error ?? null },
  });
  if (error) throw new Error(error.message);
  await admin.from("sites").update({ last_domain_at: new Date().toISOString() }).eq("id", site.id);
  const expires = result.expiresAt ? new Date(result.expiresAt).getTime() : null;
  if (expires != null && expires - Date.now() < DOMAIN_ALERT_MS) {
    await maybeAlert(admin, site, "domain", `The domain ${result.domain} expires on ${result.expiresAt}.`);
  } else if (result.ok) {
    await clearAlert(admin, site, "domain");
  }
}

async function handlePagespeed(admin: AdminClient, site: Site) {
  const result = await runPagespeed(site.url, readEnv().pagespeedApiKey);
  const { error } = await admin.from("pagespeed_snapshots").insert({
    workspace_id: site.workspace_id,
    site_id: site.id,
    strategy: "mobile",
    performance: result.performance,
    seo: result.seo,
    accessibility: result.accessibility,
    best_practices: result.bestPractices,
    lcp_ms: result.lcpMs,
    inp_ms: result.inpMs,
    cls: result.cls,
    raw_summary: result,
  });
  if (error) throw new Error(error.message);
  await admin.from("sites").update({ last_pagespeed_at: new Date().toISOString() }).eq("id", site.id);
}

async function handleCrawl(admin: AdminClient, job: JobRow, site: Site) {
  const linkCheckId = typeof job.payload?.link_check_id === "string" ? job.payload.link_check_id : "";
  const pageUrl = job.url || site.url;
  if (!linkCheckId) throw new Error("Crawl job is missing link_check_id");

  const { data, error } = await admin.from("link_checks").select("crawl_state").eq("id", linkCheckId).maybeSingle();
  if (error) throw new Error(error.message);
  const state = asState(data?.crawl_state);

  if (!state.seen.includes(pageUrl) && state.pages < CRAWL_CAP) {
    const page = await fetchPage(pageUrl);
    state.seen.push(pageUrl);
    state.pages += 1;
    if (!page.ok) {
      state.broken.push({ url: pageUrl, status: page.status, error: page.error });
    } else {
      for (const link of page.links) {
        if (state.seen.length + state.queue.length >= CRAWL_CAP) break;
        if (!state.seen.includes(link) && !state.queue.includes(link)) state.queue.push(link);
      }
    }
  }

  const next = state.queue.shift() ?? null;
  const { error: updateError } = await admin
    .from("link_checks")
    .update({
      pages_crawled: state.pages,
      broken: state.broken.slice(0, CRAWL_CAP),
      crawl_state: state,
    })
    .eq("id", linkCheckId);
  if (updateError) throw new Error(updateError.message);

  if (next) {
    const { error: insertError } = await admin.from("check_jobs").insert({
      workspace_id: site.workspace_id,
      site_id: site.id,
      kind: "crawl_page",
      url: next,
      payload: { link_check_id: linkCheckId },
    });
    if (insertError) throw new Error(insertError.message);
  } else {
    await admin.from("sites").update({ last_crawl_at: new Date().toISOString() }).eq("id", site.id);
  }
}

async function processJob(admin: AdminClient, job: JobRow) {
  const site = await loadSite(admin, job.site_id);
  if (!site) {
    await finish(admin, job.id);
    return;
  }
  if (job.kind === "uptime") await handleUptime(admin, site);
  else if (job.kind === "ssl") await handleSsl(admin, site);
  else if (job.kind === "domain") await handleDomain(admin, site);
  else if (job.kind === "pagespeed") await handlePagespeed(admin, site);
  else await handleCrawl(admin, job, site);
  await finish(admin, job.id);
}

export async function processBatch(options: { limit: number; siteId?: string }) {
  const admin = createAdmin();
  const { data, error } = await admin.rpc("claim_check_jobs", {
    batch_size: options.limit,
    site_filter: options.siteId ?? null,
  });
  if (error) throw new Error(error.message);
  const jobs = (Array.isArray(data) ? data : data ? [data] : []) as JobRow[];
  let processed = 0;
  for (const job of jobs) {
    try {
      await processJob(admin, job);
      processed += 1;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Check failed";
      await fail(admin, job, message);
    }
  }
  return processed;
}
