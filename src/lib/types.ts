export type Platform = "framer" | "webflow" | "nextjs";
export type PlanId = "free" | "solo" | "studio";
export type PaidPlan = "solo" | "studio";
export type MemberRole = "owner" | "member";
export type BillingInterval = "month" | "year";
export type JobKind = "uptime" | "ssl" | "domain" | "pagespeed" | "crawl_page";

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string;
  report_footer: string | null;
  trial_ends_at: string;
  created_at: string;
};

export type Client = {
  id: string;
  workspace_id: string;
  name: string;
  contact_email: string | null;
  created_at: string;
};

export type Site = {
  id: string;
  workspace_id: string;
  client_id: string;
  url: string;
  hostname: string;
  platform: Platform;
  last_uptime_at: string | null;
  last_ssl_at: string | null;
  last_domain_at: string | null;
  last_pagespeed_at: string | null;
  last_crawl_at: string | null;
  alert_down_at: string | null;
  alert_ssl_at: string | null;
  alert_domain_at: string | null;
  created_at: string;
};

export type CheckRun = {
  id: string;
  workspace_id: string;
  site_id: string;
  kind: "uptime" | "ssl" | "domain";
  ok: boolean;
  status_code: number | null;
  latency_ms: number | null;
  expires_at: string | null;
  detail: Record<string, unknown>;
  created_at: string;
};

export type PagespeedSnapshot = {
  id: string;
  site_id: string;
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  best_practices: number | null;
  lcp_ms: number | null;
  inp_ms: number | null;
  cls: number | null;
  created_at: string;
};

export type BrokenLink = {
  url: string;
  status: number | null;
  error?: string;
};

export type LinkCheck = {
  id: string;
  site_id: string;
  pages_crawled: number;
  broken: BrokenLink[];
  created_at: string;
};

export type MonthlyReport = {
  id: string;
  workspace_id: string;
  client_id: string | null;
  site_id: string | null;
  period_start: string;
  status: "draft" | "published";
  share_token: string;
  summary: string;
  uptime_ratio: number | null;
  brand_name: string | null;
  brand_color: string | null;
  logo_url: string | null;
  show_watermark: boolean;
  published_at: string | null;
  created_at: string;
};

export type ReportItem = {
  id: string;
  workspace_id: string;
  report_id: string;
  kind: "work_done" | "recommendation";
  title: string;
  body: string | null;
  price_cents: number | null;
  sort: number;
};

export type SubscriptionRow = {
  id: string;
  workspace_id: string;
  provider: "dodo" | "stripe";
  provider_customer_id: string | null;
  provider_subscription_id: string;
  plan: PaidPlan;
  interval: BillingInterval;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
};

export type ActionState = {
  error: string;
  ok: string;
  fieldErrors?: Record<string, string>;
};

export const initialActionState: ActionState = { error: "", ok: "" };
