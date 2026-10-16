import "server-only";

import { readEnv } from "@/lib/env";
import { PLANS, resolvePlan, subscriptionGrants } from "@/lib/plans";
import { createAdmin } from "@/lib/supabase/admin";
import type { JobKind, Site, SubscriptionRow } from "@/lib/types";

const DAY_MINUTES = 60 * 24;
const MONTH_MINUTES = 30 * DAY_MINUTES;

function due(last: string | null, intervalMinutes: number, now: number) {
  if (!last) return true;
  return now - new Date(last).getTime() >= intervalMinutes * 60_000;
}

async function openKinds(siteIds: string[]) {
  const admin = createAdmin();
  const map = new Map<string, Set<string>>();
  if (siteIds.length === 0) return map;
  const { data, error } = await admin
    .from("check_jobs")
    .select("site_id, kind")
    .in("site_id", siteIds)
    .in("status", ["pending", "running"]);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    const set = map.get(row.site_id as string) ?? new Set<string>();
    set.add(row.kind as string);
    map.set(row.site_id as string, set);
  }
  return map;
}

async function planForWorkspaces(workspaceIds: string[]) {
  const admin = createAdmin();
  const plans = new Map<string, keyof typeof PLANS>();
  if (workspaceIds.length === 0) return plans;
  const [{ data: workspaces, error: workspaceError }, { data: subs, error: subError }] = await Promise.all([
    admin.from("workspaces").select("id, trial_ends_at").in("id", workspaceIds),
    admin
      .from("subscriptions")
      .select("workspace_id, plan, status, current_period_end, updated_at")
      .in("workspace_id", workspaceIds)
      .order("updated_at", { ascending: false }),
  ]);
  if (workspaceError) throw new Error(workspaceError.message);
  if (subError) throw new Error(subError.message);
  const byWorkspace = new Map<string, SubscriptionRow[]>();
  for (const sub of (subs ?? []) as SubscriptionRow[]) {
    const list = byWorkspace.get(sub.workspace_id) ?? [];
    list.push(sub);
    byWorkspace.set(sub.workspace_id, list);
  }
  for (const workspace of workspaces ?? []) {
    const granting =
      (byWorkspace.get(workspace.id as string) ?? []).find((sub) =>
        subscriptionGrants({ status: sub.status, currentPeriodEnd: sub.current_period_end }),
      ) ?? null;
    plans.set(
      workspace.id as string,
      resolvePlan({
        trialEndsAt: workspace.trial_ends_at as string,
        subscription: granting
          ? { plan: granting.plan, status: granting.status, currentPeriodEnd: granting.current_period_end }
          : null,
      }),
    );
  }
  return plans;
}

async function insertJob(site: Site, kind: JobKind, url?: string, payload?: Record<string, unknown>) {
  const admin = createAdmin();
  const { error } = await admin.from("check_jobs").insert({
    workspace_id: site.workspace_id,
    site_id: site.id,
    kind,
    url: url ?? null,
    payload: payload ?? {},
  });
  if (error) throw new Error(error.message);
}

async function enqueueCrawl(site: Site) {
  const admin = createAdmin();
  const { data, error } = await admin
    .from("link_checks")
    .insert({
      workspace_id: site.workspace_id,
      site_id: site.id,
      pages_crawled: 0,
      broken: [],
      crawl_state: { queue: [], seen: [], broken: [], pages: 0 },
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await insertJob(site, "crawl_page", site.url, { link_check_id: data.id as string });
}

export async function enqueueForSites(sites: Site[], force: boolean) {
  if (sites.length === 0) return;
  const now = Date.now();
  const env = readEnv();
  const open = await openKinds(sites.map((site) => site.id));
  const plans = await planForWorkspaces([...new Set(sites.map((site) => site.workspace_id))]);

  for (const site of sites) {
    const plan = PLANS[plans.get(site.workspace_id) ?? "free"];
    const kinds = open.get(site.id) ?? new Set<string>();
    const wanted: Array<{ kind: JobKind; when: boolean }> = [
      { kind: "uptime", when: force || due(site.last_uptime_at, plan.uptimeIntervalMinutes, now) },
      { kind: "ssl", when: force || due(site.last_ssl_at, DAY_MINUTES, now) },
      { kind: "domain", when: force || due(site.last_domain_at, DAY_MINUTES, now) },
      { kind: "pagespeed", when: Boolean(env.pagespeedApiKey) && (force || due(site.last_pagespeed_at, MONTH_MINUTES, now)) },
      { kind: "crawl_page", when: force || due(site.last_crawl_at, MONTH_MINUTES, now) },
    ];
    for (const item of wanted) {
      if (!item.when || kinds.has(item.kind)) continue;
      if (item.kind === "crawl_page") {
        await enqueueCrawl(site);
      } else {
        await insertJob(site, item.kind, site.url);
      }
      kinds.add(item.kind);
    }
  }
}

export async function enqueueDueChecks() {
  const admin = createAdmin();
  const { data, error } = await admin.from("sites").select("*");
  if (error) throw new Error(error.message);
  await enqueueForSites((data ?? []) as Site[], false);
}

export async function enqueueSiteNow(siteId: string) {
  const admin = createAdmin();
  const { data, error } = await admin.from("sites").select("*").eq("id", siteId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return;
  await enqueueForSites([data as Site], true);
}
