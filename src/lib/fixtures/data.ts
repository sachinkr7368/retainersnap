import type { HealthResponse } from "@/lib/health-types";
import { PLANS } from "@/lib/plans";
import { emptyMetrics, toReportView } from "@/lib/report-view";
import type { BillingState, Membership } from "@/lib/session";
import type { Client, Site, Workspace } from "@/lib/types";

export const fixtureWorkspace: Workspace = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "North Studio",
  slug: "north-studio",
  logo_url: null,
  brand_color: "#1f6b45",
  report_footer: "North Studio · design and care",
  trial_ends_at: "2026-10-27T00:00:00.000Z",
  created_at: "2026-10-01T00:00:00.000Z",
};

export const fixtureClient: Client = {
  id: "00000000-0000-4000-8000-000000000002",
  workspace_id: fixtureWorkspace.id,
  name: "Harbor Goods",
  contact_email: "hello@harbor.example",
  created_at: "2026-10-02T00:00:00.000Z",
};

export const fixtureSite: Site = {
  id: "00000000-0000-4000-8000-000000000003",
  workspace_id: fixtureWorkspace.id,
  client_id: fixtureClient.id,
  url: "https://harbor.example",
  hostname: "harbor.example",
  platform: "framer",
  last_uptime_at: "2026-10-16T12:00:00.000Z",
  last_ssl_at: "2026-10-16T12:00:00.000Z",
  last_domain_at: "2026-10-16T12:00:00.000Z",
  last_pagespeed_at: "2026-10-16T12:00:00.000Z",
  last_crawl_at: "2026-10-16T12:00:00.000Z",
  alert_down_at: null,
  alert_ssl_at: null,
  alert_domain_at: null,
  created_at: "2026-10-02T00:00:00.000Z",
};

export const fixtureMemberships: Membership[] = [{ role: "owner", workspace: fixtureWorkspace }];

export const fixtureBilling: BillingState = {
  plan: "studio",
  limits: PLANS.studio,
  subscription: null,
  granting: null,
  trialDaysLeft: 10,
};

export const fixtureReport = toReportView({
  studioName: fixtureWorkspace.name,
  logoUrl: null,
  color: fixtureWorkspace.brand_color,
  watermark: false,
  footer: fixtureWorkspace.report_footer,
  clientName: fixtureClient.name,
  hostname: fixtureSite.hostname,
  url: fixtureSite.url,
  platform: fixtureSite.platform,
  periodStart: "2026-10-01",
  summary:
    "harbor.example stayed up 99.5% in October 2026. SSL and the domain both have months left. One page returned a broken response in the latest crawl.",
  metrics: {
    ...emptyMetrics,
    uptimeRatio: 0.995,
    sslExpiresAt: "2027-04-01T00:00:00.000Z",
    domainExpiresAt: "2027-08-01T00:00:00.000Z",
    registrar: "Example Registrar",
    performance: 92,
    seo: 100,
    accessibility: 96,
    bestPractices: 100,
    lcpMs: 1800,
    inpMs: 80,
    cls: 0.02,
    pagesCrawled: 12,
    broken: [{ url: "https://harbor.example/old", status: 404 }],
  },
  items: [
    {
      id: "00000000-0000-4000-8000-000000000010",
      workspace_id: fixtureWorkspace.id,
      report_id: "00000000-0000-4000-8000-000000000020",
      kind: "work_done",
      title: "Rebuilt the product grid",
      body: "Images now load from the right size.",
      price_cents: 35000,
      sort: 0,
    },
    {
      id: "00000000-0000-4000-8000-000000000011",
      workspace_id: fixtureWorkspace.id,
      report_id: "00000000-0000-4000-8000-000000000020",
      kind: "recommendation",
      title: "Add a returns page",
      body: null,
      price_cents: 18000,
      sort: 1,
    },
  ],
});

export const fixtureHealth: HealthResponse = {
  url: "https://harbor.example",
  hostname: "harbor.example",
  fetchedAt: "2026-10-16T12:00:00.000Z",
  uptime: { ok: true, statusCode: 200, latencyMs: 180 },
  ssl: { ok: true, expiresAt: "2027-04-01T00:00:00.000Z", issuer: "Example CA" },
  domain: { ok: true, expiresAt: "2027-08-01T00:00:00.000Z", registrar: "Example Registrar", domain: "harbor.example" },
  pagespeed: {
    ok: true,
    performance: 92,
    seo: 100,
    accessibility: 96,
    bestPractices: 100,
    lcpMs: 1800,
    inpMs: 80,
    cls: 0.02,
  },
};
