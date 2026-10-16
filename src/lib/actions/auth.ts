"use server";

import { redirect } from "next/navigation";
import { fail, invalidAction, succeed } from "@/lib/action-state";
import { readEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { safeNext } from "@/lib/urls";
import { userMessage } from "@/lib/user-message";
import { emailFormSchema, loginSchema, passwordFormSchema, signupSchema } from "@/lib/validators";

async function authClient() {
  try {
    return { supabase: await createClient(), error: "" };
  } catch {
    return { supabase: null, error: "Sign-in is not available yet." };
  }
}

export async function login(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return invalidAction(parsed.error);
  const { supabase, error: configError } = await authClient();
  if (!supabase) return fail(configError);
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return fail(userMessage(error.message, "Sign-in did not work. Try again."));
  redirect(safeNext(formData.get("next")));
}

export async function signup(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    studio_name: formData.get("studio_name"),
  });
  if (!parsed.success) return invalidAction(parsed.error);
  const env = readEnv();
  const { supabase, error: configError } = await authClient();
  if (!supabase) return fail(configError);
  const next = safeNext(formData.get("next"));
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { studio_name: parsed.data.studio_name },
      emailRedirectTo: `${env.appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return fail(userMessage(error.message, "The account could not be created. Try again."));
  if (data.session) redirect(next);
  return succeed("Check your email to confirm the account, then come back and sign in.");
}

export async function sendMagicLink(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailFormSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return invalidAction(parsed.error);
  const env = readEnv();
  const next = safeNext(formData.get("next"));
  const { supabase, error: configError } = await authClient();
  if (!supabase) return fail(configError);
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${env.appUrl}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return fail(userMessage(error.message, "The sign-in link could not be sent. Try again."));
  return succeed("Link sent. It expires soon, so open it from this browser.");
}

export async function sendPasswordReset(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailFormSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return invalidAction(parsed.error);
  const env = readEnv();
  const { supabase, error: configError } = await authClient();
  if (!supabase) return fail(configError);
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.appUrl}/auth/callback?next=/app/settings`,
  });
  if (error) return fail(userMessage(error.message, "The reset email could not be sent. Try again."));
  return succeed("If that inbox is registered, a reset link is on the way.");
}

export async function updatePassword(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = passwordFormSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return invalidAction(parsed.error);
  const { supabase, error: configError } = await authClient();
  if (!supabase) return fail(configError);
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(userMessage(error.message, "The password could not be updated. Try again."));
  return succeed("Password updated.");
}

export async function signOut() {
  const { supabase } = await authClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
