import { z } from "zod";
import { enqueueSiteNow } from "@/lib/checks/enqueue";
import { processBatch } from "@/lib/checks/process";
import { friendlyDbError } from "@/lib/db-error";
import { missingCoreEnv } from "@/lib/env";
import { apiError, apiOk } from "@/lib/http";
import { getMember } from "@/lib/session";
import { createAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const paramsSchema = z.object({ siteId: z.string().uuid() });

export async function POST(_request: Request, context: { params: Promise<{ siteId: string }> }) {
  if (missingCoreEnv().length > 0) {
    return apiError("not_configured", "Checks are not available right now.", 503);
  }
  const member = await getMember();
  if (!member) return apiError("unauthenticated", "Sign in to run checks.", 401);

  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return apiError("not_found", "Unknown site.", 404);

  const admin = createAdmin();
  const { data, error } = await admin
    .from("sites")
    .select("id")
    .eq("id", parsed.data.siteId)
    .eq("workspace_id", member.workspace.id)
    .maybeSingle();
  if (error) return apiError("lookup_failed", friendlyDbError(error.message, "Could not load the site."), 500);
  if (!data) return apiError("not_found", "Unknown site.", 404);

  try {
    await enqueueSiteNow(parsed.data.siteId);
    const processed = await processBatch({ limit: 3, siteId: parsed.data.siteId });
    return apiOk({ processed });
  } catch {
    return apiError("checks_failed", "The checks did not finish. Try again.", 500);
  }
}
