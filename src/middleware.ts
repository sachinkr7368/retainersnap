import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeaders, buildContentSecurityPolicy, createNonce } from "@/lib/csp";
import { isPreviewPath, previewEnabled } from "@/lib/preview";
import { updateSession } from "@/lib/supabase/middleware";

function previewClosedPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>Not found · RetainerSnap</title>
<style>
  body{margin:0;background:#f4f0e6;color:#1c1915;font-family:Georgia,serif}
  main{max-width:36rem;margin:0 auto;padding:6rem 1.5rem}
  p,a{font-family:ui-sans-serif,system-ui,sans-serif}
  .kicker{letter-spacing:.16em;text-transform:uppercase;font-size:12px;color:#6e675e}
  .copy{color:#6e675e}
  a{color:#1f6b45}
</style>
</head>
<body>
<main>
<p class="kicker">404</p>
<h1>That page is not here</h1>
<p class="copy">The report may still be a draft, or the link may have changed.</p>
<p><a href="/">Back home</a></p>
</main>
</body>
</html>`;
}

export async function middleware(request: NextRequest) {
  const value = createNonce();
  const csp = buildContentSecurityPolicy(value);
  // The preview layout calls notFound() after the root document has started,
  // which leaves the HTTP status at 200 and still ships the gallery payload.
  if (isPreviewPath(request.nextUrl.pathname) && !previewEnabled()) {
    const response = new NextResponse(previewClosedPage(), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
    applySecurityHeaders(response, csp);
    return response;
  }
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
