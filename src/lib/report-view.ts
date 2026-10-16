import type { ReportView } from "@/components/report-document";
import { periodLabel } from "@/lib/format";
import type { BrokenLink, ReportItem } from "@/lib/types";

export type ReportMetricInput = {
  uptimeRatio: number | null;
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
  broken: BrokenLink[];
  pagesCrawled: number;
};

export const emptyMetrics: ReportMetricInput = {
  uptimeRatio: null,
  sslExpiresAt: null,
  domainExpiresAt: null,
  registrar: null,
  performance: null,
  seo: null,
  accessibility: null,
  bestPractices: null,
  lcpMs: null,
  inpMs: null,
  cls: null,
  broken: [],
  pagesCrawled: 0,
};

export function toReportView(input: {
  studioName: string;
  logoUrl: string | null;
  color: string;
  watermark: boolean;
  footer: string | null;
  clientName: string;
  hostname: string;
  url: string;
  platform: string;
  periodStart: string;
  summary: string;
  metrics: ReportMetricInput;
  items: ReportItem[];
}): ReportView {
  const metrics = input.metrics;
  return {
    studioName: input.studioName,
    logoUrl: input.logoUrl,
    color: input.color,
    watermark: input.watermark,
    footer: input.footer,
    clientName: input.clientName,
    hostname: input.hostname,
    url: input.url,
    platform: input.platform,
    period: periodLabel(input.periodStart),
    summary: input.summary,
    uptimeRatio: metrics.uptimeRatio,
    sslExpiresAt: metrics.sslExpiresAt,
    domainExpiresAt: metrics.domainExpiresAt,
    registrar: metrics.registrar,
    performance: metrics.performance,
    seo: metrics.seo,
    accessibility: metrics.accessibility,
    bestPractices: metrics.bestPractices,
    lcpMs: metrics.lcpMs,
    inpMs: metrics.inpMs,
    cls: metrics.cls,
    broken: metrics.broken,
    pagesCrawled: metrics.pagesCrawled,
    items: input.items,
  };
}
