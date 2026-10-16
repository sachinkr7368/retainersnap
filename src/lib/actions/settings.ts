"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fail, invalidAction, succeed } from "@/lib/action-state";
import { readEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email/resend";
import { friendlyDbError } from "@/lib/db-error";
import { requireMember, setWorkspaceCookie } from "@/lib/session";
import { createAdmin } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/types";
import { validateSlug } from "@/lib/urls";
import { brandSchema, emailFormSchema } from "@/lib/validators";

export async function setWorkspace(formData: FormData) {
  const workspaceId = String(formData.get("workspace_id") ?? "");
  const { memberships } = await requireMember();
  const match = memberships.find((member) => member.workspace.id === workspaceId);
  if (!match) return;
  await setWorkspaceCookie(match.workspace.id);
  revalidatePath("/app");
}

export async function saveBrand(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = brandSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    brand_color: formData.get("brand_color"),
    report_footer: formData.get("report_footer") ?? "",
  });
  if (!parsed.success) return invalidAction(parsed.error);
  const slugError = validateSlug(parsed.data.slug);
  if (slugError) return { error: "", ok: "", fieldErrors: { slug: slugError } };

  const { workspace } = await requireMember();
  const admin = createAdmin();
  const { error } = await admin
    .from("workspaces")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      brand_color: parsed.data.brand_color,
      report_footer: parsed.data.report_footer || null,
    })
    .eq("id", workspace.id);
  if (error) return fail(friendlyDbError(error.message, "Could not save branding."));
  revalidatePath("/app/settings");
  return succeed("Branding saved.");
}

export async function uploadLogo(_state: ActionState, formData: FormData): Promise<ActionState> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return fail("Choose a PNG, JPEG, or WebP.");
  if (file.size > 1_000_000) return fail("Logo must be 1 MB or smaller.");
  const types: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
  const ext = types[file.type];
  if (!ext) return fail("Use a PNG, JPEG, or WebP.");

  const { workspace } = await requireMember();
  const admin = createAdmin();
  const path = `${workspace.id}/logo.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await admin.storage.from("branding").upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  });
  if (error) return fail("The logo could not be uploaded.");
  const { data } = admin.storage.from("branding").getPublicUrl(path);
  const logoUrl = `${data.publicUrl}?v=${Date.now()}`;
  const { error: updateError } = await admin.from("workspaces").update({ logo_url: logoUrl }).eq("id", workspace.id);
  if (updateError) return fail("The logo was stored but the workspace could not be updated.");
  revalidatePath("/app/settings");
  return succeed("Logo updated.");
}

export async function createInvite(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailFormSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return invalidAction(parsed.error);
  const { workspace, role, user } = await requireMember();
  if (role !== "owner") return fail("Only the workspace owner can invite people.");
  if (parsed.data.email.toLowerCase() === user.email?.toLowerCase()) {
    return fail("You are already in this workspace.");
  }
  const admin = createAdmin();
  const { data, error } = await admin.rpc("create_invite", {
    p_workspace: workspace.id,
    p_email: parsed.data.email,
  });
  if (error) return fail(friendlyDbError(error.message, "Could not create the invite."));
  const invite = Array.isArray(data) ? data[0] : data;
  const token = invite && typeof invite === "object" && "token" in invite ? String(invite.token) : "";
  const env = readEnv();
  const link = `${env.appUrl}/invite/${token}`;
  if (token) {
    await sendEmail({
      to: parsed.data.email,
      subject: `${workspace.name} invited you to RetainerSnap`,
      text: `Join ${workspace.name} on RetainerSnap: ${link}`,
      html: `<p>${workspace.name} invited you to RetainerSnap.</p><p><a href="${link}">Accept the invite</a></p>`,
    });
  }
  revalidatePath("/app/settings");
  return succeed(token ? `Invite ready. Share ${link}` : "Invite created.");
}

export async function revokeInvite(formData: FormData) {
  const inviteId = String(formData.get("invite_id") ?? "");
  const { workspace, role } = await requireMember();
  if (role !== "owner") return;
  const admin = createAdmin();
  await admin
    .from("workspace_invites")
    .delete()
    .eq("id", inviteId)
    .eq("workspace_id", workspace.id)
    .is("accepted_at", null);
  revalidatePath("/app/settings");
}

export async function acceptInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const { user } = await requireMember(`/invite/${token}`);
  if (!user.email) redirect(`/invite/${token}?error=missing-email`);
  const admin = createAdmin();
  const { data, error } = await admin.rpc("accept_invite", {
    p_token: token,
    p_user: user.id,
    p_email: user.email,
  });
  if (error) {
    redirect(`/invite/${token}?error=${encodeURIComponent(friendlyDbError(error.message, "Could not accept the invite."))}`);
  }
  const workspaceId = typeof data === "string" ? data : "";
  if (workspaceId) await setWorkspaceCookie(workspaceId);
  redirect("/app");
}
