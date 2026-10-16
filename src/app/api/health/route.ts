import { z } from "zod";
import { runPagespeed } from "@/lib/checks/pagespeed";
import { runRdap } from "@/lib/checks/rdap";
import { runSsl } from "@/lib/checks/ssl";
import { runUptime } from "@/lib/checks/uptime";
import { missingCoreEnv, readEnv } from "@/lib/env";
import type { HealthResponse } from "@/lib/health-types";
import { apiError, apiOk } from "@/lib/http";
import { publicMessage } from "@/lib/api-result";
import { userMessage } from "@/lib/user-message";
import { consumeHealthQuota } from "@/lib/rate-limit";
import { parsePublicUrl, registrableDomain } from "@/lib/urls";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  url: z.string().trim().min(4, "Enter a site URL.").max(2000),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("invalid_json", "Enter a public site URL.", 400);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError("invalid_body", "Enter a public site URL.", 400);
  }

  let target: URL;
  try {
    target = parsePublicUrl(parsed.data.url);
  } catch (error) {
    return apiError("invalid_url", publicMessage(error, "That URL is not usable."), 400);
  }

  const env = readEnv();
  if (missingCoreEnv().length > 0 || !env.pagespeedApiKey) {
    return apiError(
      "not_configured",
      "This check is not available right now. Try again later.",
      503,
    );
  }

  try {
    const quota = await consumeHealthQuota(request);
    if (!quota.allowed) {
      return apiError(
        "rate_limited",
        "This free check is limited to 8 runs an hour. Create a free account to watch a site and send the report yourself.",
        429,
      );
    }
  } catch (error) {
    return apiError("rate_limit_unavailable", publicMessage(error, "The check could not be counted. Try again in a minute."), 503);
  }

  const canonical = target.toString();
  const hostname = target.hostname.toLowerCase();
  const [uptime, ssl, domain, pagespeed] = await Promise.all([
    runUptime(canonical),
    runSsl(hostname).catch((error: unknown) => ({
      ok: false,
      expiresAt: null,
      issuer: null,
      error: publicMessage(error, "The certificate date could not be read."),
    })),
    runRdap(hostname).catch((error: unknown) => ({
      ok: false,
      expiresAt: null,
      registrar: null,
      domain: registrableDomain(hostname),
      error: publicMessage(error, "The domain date could not be read."),
    })),
    runPagespeed(canonical, env.pagespeedApiKey)
      .then((result) => ({ ok: true as const, ...result }))
      .catch((error: unknown) => ({
        ok: false as const,
        performance: null,
        seo: null,
        accessibility: null,
        bestPractices: null,
        lcpMs: null,
        inpMs: null,
        cls: null,
        error: publicMessage(error, "PageSpeed could not score this site."),
      })),
  ]);

  const payload: HealthResponse = {
    url: canonical,
    hostname,
    fetchedAt: new Date().toISOString(),
    uptime: {
      ...uptime,
      error: uptime.error ? userMessage(uptime.error, "The site did not respond.") : undefined,
    },
    ssl,
    domain,
    pagespeed,
  };
  return apiOk(payload);
}
