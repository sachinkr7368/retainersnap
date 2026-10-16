import { enqueueDueChecks } from "@/lib/checks/enqueue";
import { processBatch } from "@/lib/checks/process";
import { readEnv } from "@/lib/env";
import { apiError, apiOk } from "@/lib/http";
import { safeEqual } from "@/lib/safe-equal";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const env = readEnv();
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!env.cronSecret || !safeEqual(token, env.cronSecret)) {
    return apiError("unauthorized", "Unauthorized", 401);
  }

  try {
    await enqueueDueChecks();
    const processed = await processBatch({ limit: 4 });
    return apiOk({ processed });
  } catch {
    return apiError("cron_failed", "Cron failed.", 500);
  }
}
