import assert from "node:assert/strict";
import { fieldErrorsFrom } from "../src/lib/action-state";
import { isApiFailure, isApiSuccess, publicMessage } from "../src/lib/api-result";
import { userMessage } from "../src/lib/user-message";
import { buildContentSecurityPolicy } from "../src/lib/csp";
import { previewShots } from "../src/lib/fixtures/catalog";
import { isPreviewPath, previewEnabled } from "../src/lib/preview";
import { resolvePlan } from "../src/lib/plans";
import { buildSummary } from "../src/lib/summary";
import { isPrivateHost, parsePublicUrl, registrableDomain } from "../src/lib/urls";
import { loginSchema } from "../src/lib/validators";

assert.equal(isPrivateHost("localhost"), true);
assert.equal(isPrivateHost("10.1.1.1"), true);
assert.equal(isPrivateHost("192.168.0.8"), true);
assert.equal(isPrivateHost("127.0.0.1"), true);
assert.equal(isPrivateHost("169.254.1.1"), true);
assert.equal(isPrivateHost("example.com"), false);

assert.throws(() => parsePublicUrl("http://127.0.0.1/secret"));
assert.throws(() => parsePublicUrl("https://user:pass@example.com/admin"));
assert.throws(() => parsePublicUrl("http://localhost:3000"));
assert.equal(parsePublicUrl("example.com").protocol, "https:");

assert.equal(registrableDomain("www.example.co.uk"), "example.co.uk");
assert.equal(registrableDomain("www.example.com"), "example.com");

const future = new Date(Date.now() + 86_400_000).toISOString();
const past = new Date(Date.now() - 86_400_000).toISOString();

assert.equal(resolvePlan({ trialEndsAt: future, subscription: null }), "studio");
assert.equal(resolvePlan({ trialEndsAt: past, subscription: null }), "free");
assert.equal(
  resolvePlan({
    trialEndsAt: future,
    subscription: { plan: "solo", status: "active", currentPeriodEnd: future },
  }),
  "solo",
);
assert.equal(
  resolvePlan({
    trialEndsAt: past,
    subscription: { plan: "studio", status: "cancelled", currentPeriodEnd: future },
  }),
  "studio",
);
assert.equal(
  resolvePlan({
    trialEndsAt: past,
    subscription: { plan: "studio", status: "cancelled", currentPeriodEnd: past },
  }),
  "free",
);
assert.equal(
  resolvePlan({
    trialEndsAt: past,
    subscription: { plan: "studio", status: "on_hold", currentPeriodEnd: future },
  }),
  "free",
);

const summary = buildSummary({
  hostname: "client.framer.app",
  periodLabel: "October 2026",
  uptimeRatio: 0.995,
  sslExpiresAt: null,
  domainExpiresAt: null,
  brokenCount: 0,
  performance: 90,
});
assert.match(summary, /client\.framer\.app/);
assert.match(summary, /99\.5%/);

assert.equal(previewEnabled(), false);
assert.equal(isPreviewPath("/preview"), true);
assert.equal(isPreviewPath("/preview/billing"), true);
assert.equal(isPreviewPath("/pricing"), false);
assert.equal(previewShots.length >= 10, true);
assert.equal(loginSchema.safeParse({ email: "ada@example.com", password: "short" }).success, false);
const loginError = loginSchema.safeParse({ email: "not-an-email", password: "x" });
assert.equal(loginError.success, false);
if (!loginError.success) {
  const fields = fieldErrorsFrom(loginError.error);
  assert.equal(typeof fields.email, "string");
}

const csp = buildContentSecurityPolicy("abc", { dev: false });
assert.match(csp, /frame-ancestors 'none'/);
assert.match(csp, /object-src 'none'/);
assert.doesNotMatch(csp, /unsafe-eval/);
assert.equal(isApiSuccess({ ok: true, data: { n: 1 } }), true);
assert.equal(isApiFailure({ ok: false, error: { code: "nope", message: "No" } }), true);
assert.equal(publicMessage(new Error("sk_test_secretvalue"), "fallback"), "fallback");
assert.equal(
  publicMessage(new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"), "Sign-in is not available yet."),
  "Sign-in is not available yet.",
);
assert.equal(userMessage("Invalid login credentials", "fallback"), "That email and password do not match.");
assert.equal(
  userMessage("That host is private. RetainerSnap only checks public sites.", "fallback"),
  "That host is private. RetainerSnap only checks public sites.",
);
assert.equal(userMessage("PAGESPEED_API_KEY is not set", "This check is not available right now."), "This check is not available right now.");

console.log("self-check ok");
