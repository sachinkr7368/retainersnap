"use server";

import { redirect } from "next/navigation";
import { fail, invalidAction } from "@/lib/action-state";
import { enqueueSiteNow } from "@/lib/checks/enqueue";
import { friendlyDbError } from "@/lib/db-error";
import { requireMember } from "@/lib/session";
import { createAdmin } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/types";
import { canonicalSiteUrl, parsePublicUrl } from "@/lib/urls";
import { siteSchema } from "@/lib/validators";

export async function addSite(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = siteSchema.safeParse({
    client_id: formData.get("client_id"),
    url: formData.get("url"),
    platform: formData.get("platform"),
  });
  if (!parsed.success) return invalidAction(parsed.error);

  let canonical: string;
  let hostname: string;
  try {
    const url = parsePublicUrl(parsed.data.url);
    canonical = canonicalSiteUrl(url);
    hostname = url.hostname.toLowerCase();
  } catch (error) {
    const message = error instanceof Error ? error.message : "That URL is not usable.";
    return { error: "", ok: "", fieldErrors: { url: message } };
  }

  const { workspace } = await requireMember();
  const admin = createAdmin();
  const { data, error } = await admin.rpc("insert_site", {
    p_workspace: workspace.id,
    p_client: parsed.data.client_id,
    p_url: canonical,
    p_hostname: hostname,
    p_platform: parsed.data.platform,
  });
  if (error) return fail(friendlyDbError(error.message, "Could not add the site."));
  const row = Array.isArray(data) ? data[0] : data;
  const siteId = row && typeof row === "object" && "id" in row ? String(row.id) : "";
  if (!siteId) return fail("The site was saved but the id did not come back.");
  try {
    await enqueueSiteNow(siteId);
  } catch {
    // The site exists. Checks can be queued from the site page.
  }
  redirect(`/app/sites/${siteId}`);
}
