import "server-only";

import type { AdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import type { Site } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

async function ownerEmail(admin: AdminClient, workspaceId: string) {
  const { data } = await admin
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (!data?.user_id) return null;
  const user = await admin.auth.admin.getUserById(data.user_id as string);
  return user.data.user?.email ?? null;
}

export async function maybeAlert(
  admin: AdminClient,
  site: Site,
  kind: "down" | "ssl" | "domain",
  message: string,
) {
  const column = kind === "down" ? "alert_down_at" : kind === "ssl" ? "alert_ssl_at" : "alert_domain_at";
  const last = site[column];
  if (last && Date.now() - new Date(last).getTime() < DAY_MS) return;

  const email = await ownerEmail(admin, site.workspace_id);
  let sent = false;
  if (email) {
    const result = await sendEmail({
      to: email,
      subject: `RetainerSnap: ${site.hostname}`,
      text: `${message}\n\nSite: ${site.url}`,
      html: `<p>${message}</p><p><a href="${site.url}">${site.hostname}</a></p>`,
    });
    sent = result.sent;
  }

  await admin.from("alerts").insert({
    workspace_id: site.workspace_id,
    site_id: site.id,
    kind,
    sent,
    detail: message,
  });
  await admin.from("sites").update({ [column]: new Date().toISOString() }).eq("id", site.id);
  site[column] = new Date().toISOString();
}

export async function clearAlert(admin: AdminClient, site: Site, kind: "down" | "ssl" | "domain") {
  const column = kind === "down" ? "alert_down_at" : kind === "ssl" ? "alert_ssl_at" : "alert_domain_at";
  if (!site[column]) return;
  await admin.from("sites").update({ [column]: null }).eq("id", site.id);
  site[column] = null;
}
