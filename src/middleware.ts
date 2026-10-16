import { type NextRequest } from "next/server";
import { applySecurityHeaders, buildContentSecurityPolicy, createNonce } from "@/lib/csp";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const value = createNonce();
  const csp = buildContentSecurityPolicy(value);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", value);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = await updateSession(request, requestHeaders);
  applySecurityHeaders(response, csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
