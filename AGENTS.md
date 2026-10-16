# RetainerSnap agent guide

Read this file before editing. The product architecture is `docs/ARCHITECTURE.md`. The skill with the same rules is `.claude/skills/retainersnap/SKILL.md`.

## Product

Monthly branded client reports for Framer, Webflow, and Next.js retainers. Plans are Free ($0, 2 sites), Solo ($19/mo or $190/yr, 15 sites), and Studio ($49/mo or $490/yr, 50 sites, 3 seats, 5-minute checks). New accounts get 14 days of Studio with no card. Report copy is a template. Do not add a paid AI provider.

## Stack

Next.js 15 App Router, TypeScript strict, Tailwind CSS 4, Supabase, Resend, PageSpeed Insights. Payments go through `PaymentProvider`. This deployment uses Stripe test mode. Dodo stays behind the same interface. The git host is Vercel. Cloudflare OpenNext is optional.

Do not upgrade to Next.js 16. The OpenNext path prefetch-loops on 16.

## UI

Tokens live in `src/app/globals.css`: paper `#f4f0e6`, ink `#1c1915`, moss `#1f6b45`, moss-deep `#164e33`, clay `#c4512c`, line `#e4dccb`, card `#fffdf8`, muted `#6e675e`. Fonts are Fraunces and Outfit. Keep the editorial look. Do not introduce a purple SaaS theme.

Primitives are in `src/components/ui` (button, input, label, textarea, card, badge, alert). `components.json` points at them. New controls go there and use `cn` from `src/lib/utils.ts`.

Single-line controls are at least 44px (`h-11`). Textareas do not get a fixed height. Pricing and billing use `PlanGrid`: five rows, shared baseline, full-width actions. Do not put `mt-auto` on a subgrid action cell.

## Data and forms

- Zod schemas live only in `src/lib/validators.ts`. Forms and server actions import those schemas.
- Client forms live in `src/components/forms.tsx`. A server component must not receive a Zod schema or a render function. Pass plain props and a server action.
- Server Components load data. TanStack Query is for client mutations (health, run checks, checkout) under `Providers`. Do not convert RSC pages into client fetches.
- JSON routes return `{ ok: true, data }` or `{ ok: false, error: { code, message } }` via `src/lib/http.ts`.
- Action results use `ActionState`. Field errors come from `invalidAction`. User-facing failures go through `fail` or `friendlyDbError`. Never return a stack, `service_role`, or a secret key.

## Security

Middleware sets the CSP and the other security headers. Keep `frame-ancestors 'none'` and `object-src 'none'`. `unsafe-eval` stays dev-only. Do not weaken connect-src to `*`.

Public URL checks reject private hosts. Cron requires `CRON_SECRET`. Webhooks require signatures. Writes use the service role only after a membership check.

`/preview` renders only when `ALLOW_PREVIEW=1`. Do not set that variable on Vercel. Production must 404 the gallery.

## Checks and billing

Do not change `resolvePlan`, watermark rules, or the check queue unless the task is specifically about them. `on_hold` does not grant a plan. Free reports stay watermarked.

Stripe bootstrap may only touch products with metadata `retainersnap_plan`. Leave every other product on the Stripe account alone. Do not run live mode unless the user explicitly asks for a live bootstrap.

## Tests

```bash
export PATH="$HOME/.local/bin:$PATH"
pnpm typecheck
pnpm test
pnpm test:e2e
```

Playwright covers desktop 1280×900 and Pixel 5. The gallery screenshots every shot in `src/lib/fixtures/catalog.ts`. If you add a screen, add a shot and a fixture. Alignment tests must stay green.

## Secrets and git

Never commit `.env.local`, `.env.production`, or print secret values. `supabase/.temp` and Playwright output stay gitignored. Do not buy a domain. Ask the user to run `supabase login` when the remote database is required.
