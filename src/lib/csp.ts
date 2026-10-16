type HeaderCarrier = { headers: Headers };

export function createNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

export function buildContentSecurityPolicy(nonce: string, options?: { dev?: boolean }): string {
  const dev = options?.dev ?? process.env.NODE_ENV !== "production";
  const script = [
    "script-src 'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "'unsafe-inline'",
    "https://va.vercel-scripts.com",
    "https://vitals.vercel-insights.com",
    dev ? "'unsafe-eval'" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const connect = [
    "connect-src 'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.stripe.com",
    "https://checkout.stripe.com",
    "https://va.vercel-scripts.com",
    "https://vitals.vercel-insights.com",
    dev ? "ws://127.0.0.1:* ws://localhost:* http://127.0.0.1:* http://localhost:*" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://checkout.stripe.com https://billing.stripe.com https://checkout.dodopayments.com https://test.checkout.dodopayments.com",
    script,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self'",
    connect,
    "frame-src 'self' https://checkout.stripe.com https://billing.stripe.com https://js.stripe.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join("; ");
}

export function applySecurityHeaders(response: HeaderCarrier, csp: string) {
  const headers = response.headers;
  headers.set("Content-Security-Policy", csp);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  headers.set("X-DNS-Prefetch-Control", "off");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
}
