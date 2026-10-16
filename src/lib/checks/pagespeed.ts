export type PagespeedResult = {
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  lcpMs: number | null;
  inpMs: number | null;
  cls: number | null;
};

type Lighthouse = {
  categories?: Record<string, { score?: number | null }>;
  audits?: Record<string, { numericValue?: number | null }>;
};

function scoreOf(categories: Lighthouse["categories"], id: string): number | null {
  const score = categories?.[id]?.score;
  if (score == null || Number.isNaN(score)) return null;
  return Math.round(score * 100);
}

function auditMs(audits: Lighthouse["audits"], id: string): number | null {
  const value = audits?.[id]?.numericValue;
  if (value == null || Number.isNaN(value)) return null;
  return Math.round(value);
}

export async function runPagespeed(url: string, apiKey: string): Promise<PagespeedResult> {
  if (!apiKey) throw new Error("PAGESPEED_API_KEY is not set");
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("key", apiKey);
  endpoint.searchParams.set("strategy", "mobile");
  for (const category of ["performance", "seo", "accessibility", "best-practices"]) {
    endpoint.searchParams.append("category", category);
  }
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(50_000) });
  const json = (await response.json()) as { error?: { message?: string }; lighthouseResult?: Lighthouse };
  if (!response.ok) {
    throw new Error(json.error?.message || `PageSpeed returned ${response.status}`);
  }
  const lighthouse = json.lighthouseResult ?? {};
  const cls = lighthouse.audits?.["cumulative-layout-shift"]?.numericValue;
  return {
    performance: scoreOf(lighthouse.categories, "performance"),
    seo: scoreOf(lighthouse.categories, "seo"),
    accessibility: scoreOf(lighthouse.categories, "accessibility"),
    bestPractices: scoreOf(lighthouse.categories, "best-practices"),
    lcpMs: auditMs(lighthouse.audits, "largest-contentful-paint"),
    inpMs: auditMs(lighthouse.audits, "interaction-to-next-paint"),
    cls: cls == null || Number.isNaN(cls) ? null : cls,
  };
}
