import { apiError, apiOk } from "@/lib/http";
import { readEnv } from "@/lib/env";
import { safeNext } from "@/lib/urls";

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://retainersnap-staging.vercel.app",
  "https://retainersnap-git-staging-sachinkr-projects.vercel.app",
  "https://retainersnap.vercel.app",
]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { next?: unknown; origin?: unknown };
  const env = readEnv();
  if (!env.supabaseUrl) return apiError("not_configured", "Sign-in is not available yet.", 503);

  const requestedOrigin = typeof body.origin === "string" ? body.origin.replace(/\/$/, "") : "";
  const origin = allowedOrigins.has(requestedOrigin) ? requestedOrigin : env.appUrl;
  const next = safeNext(typeof body.next === "string" ? body.next : "/app");
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const authorize = new URL("/auth/v1/authorize", env.supabaseUrl);
  authorize.searchParams.set("provider", "google");
  authorize.searchParams.set("redirect_to", redirectTo);
  authorize.searchParams.set("prompt", "select_account");

  const response = await fetch(authorize, { redirect: "manual" });
  const location = response.headers.get("location") ?? "";
  if (response.status >= 300 && response.status < 400 && location.startsWith("https://accounts.google.com/")) {
    return apiOk({ url: location });
  }
  return apiError("not_enabled", "Google sign-in is not available yet. Use email and password.", 503);
}
