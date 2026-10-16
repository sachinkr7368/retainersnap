export type HealthResponse = {
  url: string;
  hostname: string;
  fetchedAt: string;
  uptime: { ok: boolean; statusCode: number | null; latencyMs: number | null; error?: string };
  ssl: { ok: boolean; expiresAt: string | null; issuer: string | null; error?: string };
  domain: { ok: boolean; expiresAt: string | null; registrar: string | null; domain: string; error?: string };
  pagespeed: {
    ok: boolean;
    performance: number | null;
    seo: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    lcpMs: number | null;
    inpMs: number | null;
    cls: number | null;
    error?: string;
  };
};
