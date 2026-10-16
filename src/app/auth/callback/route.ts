import { NextResponse } from "next/server";
import { readEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/urls";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const env = readEnv();
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, env.appUrl));
  }
  const login = new URL("/login", env.appUrl);
  login.searchParams.set("error", "callback");
  login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}
