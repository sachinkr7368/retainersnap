"use server";

import { redirect } from "next/navigation";
import { fail, invalidAction } from "@/lib/action-state";
import { friendlyDbError } from "@/lib/db-error";
import { requireMember } from "@/lib/session";
import { createAdmin } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/types";
import { clientSchema } from "@/lib/validators";

export async function addClient(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    contact_email: formData.get("contact_email") ?? "",
  });
  if (!parsed.success) return invalidAction(parsed.error);
  const { workspace } = await requireMember();
  const admin = createAdmin();
  const { data, error } = await admin
    .from("clients")
    .insert({
      workspace_id: workspace.id,
      name: parsed.data.name,
      contact_email: parsed.data.contact_email || null,
    })
    .select("id")
    .single();
  if (error) return fail(friendlyDbError(error.message, "Could not save the client."));
  redirect(`/app/clients/${data.id}`);
}

export async function updateClient(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    contact_email: formData.get("contact_email") ?? "",
  });
  if (!parsed.success) return invalidAction(parsed.error);
  const clientId = String(formData.get("client_id") ?? "");
  const { workspace } = await requireMember();
  const admin = createAdmin();
  const { error } = await admin
    .from("clients")
    .update({
      name: parsed.data.name,
      contact_email: parsed.data.contact_email || null,
    })
    .eq("id", clientId)
    .eq("workspace_id", workspace.id);
  if (error) return fail(friendlyDbError(error.message, "Could not update the client."));
  return { error: "", ok: "Client saved." };
}
