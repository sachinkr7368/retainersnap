# RetainerSnap architecture

RetainerSnap sends a monthly branded report to the client of a freelancer who maintains a Framer, Webflow, or Next.js site. The report is the reason a $300–800 retainer keeps getting paid.

## Product loop

1. A visitor can run one public health check, or create an account.
2. Signup starts a 14-day Studio trial. No card.
3. The owner adds a client, then a public site URL.
4. Checks queue in the background: uptime, SSL, domain expiry, PageSpeed, and a same-origin crawl of up to 50 pages.
5. The owner generates this month’s report, edits the summary and line items, and publishes a share link.
6. Free plans always print “Powered by RetainerSnap”. Solo and Studio can use their own logo, colour, and footer. PDF is the browser print dialog.
7. The owner subscribes on the billing page. Checkout is Stripe or Dodo, selected by `PAYMENT_PROVIDER`.

## Plans

| Plan | Price | Sites | Seats | Branding | Uptime |
| --- | --- | --- | --- | --- | --- |
| Free | $0 | 2 | 1 | Watermark | Daily |
| Solo | $19/mo or $190/yr | 15 | 1 | Own brand | Daily |
| Studio | $49/mo or $490/yr | 50 | 3 | Own brand and `{slug}.retainersnap.com` | Every 5 minutes |

Effective plan, in order:

- A subscription with status `active`, `trialing`, or `past_due` grants its plan.
- A `cancelled` subscription still grants its plan until `current_period_end`.
- `on_hold` does not grant.
- Otherwise an unexpired `workspaces.trial_ends_at` is Studio.
- Everything else is Free.

The public report recomputes the watermark from the live plan. Limits are enforced in SQL (`insert_site`, `create_invite`) and again in server actions.

## Runtime

```
browser
  └─ Next.js 15 App Router
       ├─ Server Components load workspace data
       ├─ Server Actions mutate, after Zod and a membership check
       ├─ Route handlers: health, checkout, run checks, cron, webhooks
       ├─ Supabase Auth + Postgres (RLS: authenticated is SELECT)
       ├─ service role for writes, only after the membership check
       ├─ Resend, PageSpeed Insights, crt.sh, RDAP
       └─ PaymentProvider (stripe | dodo)

Vercel (git-linked)
  ├─ production deploy from main
  ├─ Web Analytics + Speed Insights
  └─ daily cron → POST /api/cron

Optional Cloudflare Workers
  ├─ OpenNext app worker
  └─ cron worker every 5 minutes → POST /api/cron
```

Server Components stay the data path. TanStack Query wraps client islands only: the public health check, “Run checks now”, and checkout. Those mutations call the route handlers. They do not replace the server render.

## Repository map

```
src/app                  routes, including (app)/app for the signed-in product
src/app/api              JSON route handlers
src/app/preview          mock-data gallery, off unless ALLOW_PREVIEW=1
src/components/ui        shadcn-shaped primitives on the paper/ink/moss tokens
src/components/forms.tsx client forms (React Hook Form + Zod)
src/lib/actions          server actions
src/lib/validators.ts    the Zod schemas, shared by forms and actions
src/lib/http.ts          { ok, data } | { ok: false, error }
src/lib/plans.ts         prices and the effective-plan rules
src/lib/payments         PaymentProvider
supabase/migrations      schema
workers/cron             optional 5-minute worker
tests/e2e                Playwright, desktop and Pixel 5
```

## Forms and errors

Each form lives in `src/components/forms.tsx`, which is a client module. It validates with the Zod schema from `src/lib/validators.ts` through React Hook Form, then submits `FormData` to the existing server action. The action parses the same schema again.

`ActionState` is `{ error, ok, fieldErrors? }`. Validation failures fill `fieldErrors`. Unexpected failures fill `error` with a short sentence. Database errors go through `friendlyDbError`. Responses never include a stack, a service-role key, or a Stripe secret.

JSON routes use one envelope:

```json
{ "ok": true, "data": {} }
{ "ok": false, "error": { "code": "invalid_url", "message": "That host is private." } }
```

Webhooks keep their status codes. A bad signature is 401. A handler failure is 500 with the message “Webhook failed.”

## Security

Middleware refreshes the Supabase session and sets:

- Content-Security-Policy with a per-request nonce and `strict-dynamic`
- `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`
- `style-src 'self' 'unsafe-inline'` because Next and Tailwind emit inline styles
- `script-src` allows `'unsafe-eval'` only when `NODE_ENV` is not production
- connect-src limited to this origin, Supabase, Stripe, and Vercel analytics
- `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP, CORP
- HSTS in production

`upgrade-insecure-requests` is omitted so `next start` on `http://127.0.0.1` still works in CI. Vercel serves HTTPS.

Other rules:

- Public URL checks reject localhost, link-local, and private IPs, and reject URLs with embedded credentials.
- The free health check is limited to 8 runs an hour.
- Cron requires `Authorization: Bearer CRON_SECRET`, compared in constant time.
- Stripe and Dodo webhooks require their signatures before any write.
- Workspace writes use the service role only after `requireMember`.
- Authenticated database access is SELECT through RLS.
- `preview` and `setup` are reserved workspace slugs.

## Preview gallery

`/preview` and `/preview/[shot]` render every product screen from `src/lib/fixtures`. Playwright (`tests/e2e/gallery.spec.ts`) screenshots each shot on desktop and mobile, fails on horizontal overflow, and fails if an `h-11` control is shorter than 44px. The billing shot also checks that the three plan cards share one baseline.

`ALLOW_PREVIEW=1` is set on the Playwright web server for both the build and the start command, because Next inlines `process.env.ALLOW_PREVIEW` at build time. Vercel does not set it, so the route 404s in production. `robots.txt` disallows `/preview`, `/app`, and `/api/`.

## Hosting

Vercel is the deployment customers use. Analytics and Speed Insights are mounted in `src/app/layout.tsx` and record once the project has them enabled.

The Hobby cron is daily. That is enough for Free and Solo uptime. Studio’s 5-minute cadence is the Cloudflare cron worker, or a Pro cron after the schedule in `vercel.json` is changed.

Cloudflare OpenNext stays in the repo for a later custom-hostname setup. `{slug}.retainersnap.com` needs wildcard DNS on whichever host owns the domain. Customer-owned hostnames are not in this version.

## What is still outside the repo

Supabase has to be logged in (`supabase login`) before `pnpm db:apply` can create the remote database. Until those keys exist, `/app` redirects to `/setup` and the public pages, including the health form’s private-URL error, still work. PageSpeed needs `PAGESPEED_API_KEY`. Mail needs `RESEND_API_KEY`. Stripe webhooks need `STRIPE_WEBHOOK_SECRET` from `pnpm stripe:listen` locally, or from the Stripe endpoint in production.

Do not buy the domain from this repo. Do not run `pnpm stripe:bootstrap -- --live` until the production domain answers HTTPS.
