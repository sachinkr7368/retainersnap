# RetainerSnap

Monthly branded client reports for freelancers and small studios who maintain Framer, Webflow, and Next.js sites.

## Try it

| Host | Address | What it is |
| --- | --- | --- |
| Staging | [retainersnap-staging.vercel.app](https://retainersnap-staging.vercel.app) | The host to explore end to end. Sign up, add a site, run checks, open a report, and start checkout. |
| Production | [retainersnap.vercel.app](https://retainersnap.vercel.app) | The public production host. Live billing is a separate setup in [docs/PRODUCTION.md](docs/PRODUCTION.md). |
| Local | [localhost:3000](http://localhost:3000) | Your own checkout of this repo, in test mode. |

On staging, a new account gets 14 days of Studio with no card. Checkout opens Stripe test mode. Use card `4242 4242 4242 4242`, any future expiry, and any CVC. That card does not create a real charge.

Useful pages on staging:

- [/](https://retainersnap-staging.vercel.app/) is the marketing page and the free site check
- [/pricing](https://retainersnap-staging.vercel.app/pricing)
- [/signup](https://retainersnap-staging.vercel.app/signup)
- [/login](https://retainersnap-staging.vercel.app/login)
- [/demo](https://retainersnap-staging.vercel.app/demo) is a sample report

## Stack

Next.js 15 App Router, TypeScript strict, Tailwind CSS 4. The git-linked host is Vercel. Data and auth are Supabase. Mail is Resend. PageSpeed is the Google PageSpeed Insights API. Payments sit behind `PaymentProvider`. This deployment uses Stripe. Dodo stays behind the same interface. Report copy is a template. There is no paid AI provider.

Stay on Next.js 15. The optional Cloudflare OpenNext path prefetch-loops on Next.js 16.

The product architecture is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Day-to-day setup is [docs/SETUP.md](docs/SETUP.md). The launch checklist is [docs/PRODUCTION.md](docs/PRODUCTION.md). What is still open is [docs/NEXT-STEPS.md](docs/NEXT-STEPS.md).

## Run locally

Requirements: Node.js 22 or newer, and pnpm 12.

```bash
git clone https://github.com/sachinkr7368/retainersnap.git
cd retainersnap
pnpm install
cp .env.example .env.local
```

Fill `.env.local` from the comments in `.env.example`, or follow [docs/SETUP.md](docs/SETUP.md). Local stays in test mode. `PAYMENT_PROVIDER=stripe` and the Stripe key should be a test key (`sk_test_`).

```bash
pnpm dev          # http://localhost:3000
pnpm typecheck
pnpm test          # plan, URL, and summary checks. No network.
pnpm test:e2e      # Playwright on desktop and a phone-sized viewport
pnpm cron:once     # one cron pass. The dev server and CRON_SECRET must be set.
```

If `pnpm` is missing:

```bash
npm install -g pnpm --prefix "$HOME/.local"
export PATH="$HOME/.local/bin:$PATH"
```

`pnpm test:e2e` starts the app with `ALLOW_PREVIEW=1` and screenshots the public pages and the mock-data gallery. Leave `ALLOW_PREVIEW` unset on Vercel. Production and staging both 404 `/preview`.

GitHub Actions (`.github/workflows/ci.yml`) runs typecheck, unit checks, and Playwright on pushes to `main` and on pull requests. `.github/workflows/deploy.yml` is the optional Cloudflare deploy, started by hand. The customer-facing deploy is the linked Vercel project.

## Plans

| Plan | Price | Sites | Seats | Branding | Uptime |
| --- | --- | --- | --- | --- | --- |
| Free | $0 | 2 | 1 | Watermark | Daily |
| Solo | $19/mo or $190/yr | 15 | 1 | Own logo and colours | Daily |
| Studio | $49/mo or $490/yr | 50 | 3 | Own brand, `{slug}.retainersnap.com` | Every 5 minutes |

New accounts get 14 days of Studio with no card. Limits are enforced in SQL and again in the server actions. Free reports always show “Powered by RetainerSnap”. PDF is the browser print dialog.

A subscription grants its plan while status is `active`, `trialing`, or `past_due`, or `cancelled` with `current_period_end` still in the future. `on_hold` does not grant access. Otherwise an unexpired trial is Studio, and everything else is Free. The public report recomputes the watermark from the live plan.

## Architecture

```
browser ── Next.js on Vercel
              ├─ Supabase Auth (email, magic link, reset) + Postgres with RLS
              ├─ service role for writes, after a membership check
              ├─ Resend for alerts and invites
              ├─ PageSpeed Insights, certificate dates, RDAP, and a 50-page crawl
              └─ PaymentProvider
                    ├─ Stripe: Checkout, signed webhooks, cancel, billing portal
                    └─ Dodo: checkout, signed webhooks, cancel, customer portal
```

Checks are a queue (`check_jobs`). One job does one network call. Uptime is an HTTP GET. SSL prefers a live TLS handshake and falls back to crt.sh. Domain expiry comes from `https://rdap.org`. PageSpeed runs when `PAGESPEED_API_KEY` is set. The crawl stores its queue on `link_checks.crawl_state` and visits one same-origin page per job, up to 50.

Studio “custom domain” in this version is `{slug}.retainersnap.com`. That waits on the domain. Customer-owned hostnames are not in this version.

## Docs

- [docs/SETUP.md](docs/SETUP.md) for Supabase, PageSpeed, Resend, and payments
- [docs/PRODUCTION.md](docs/PRODUCTION.md) for the live host
- [docs/NEXT-STEPS.md](docs/NEXT-STEPS.md) for what staging already has and what is still open
- [docs/TEST-CHECKLIST.md](docs/TEST-CHECKLIST.md) for the manual pass
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for security headers, the API shape, and the preview gallery
- [docs/COSTS.md](docs/COSTS.md) for what stays free
- [AGENTS.md](AGENTS.md) for the rules used while changing this repo

## Folder tree

```
.
├── supabase/migrations/0001_init.sql
├── scripts/self-check.ts
├── docs/
└── src
    ├── middleware.ts
    ├── app
    │   ├── page.tsx                    landing and the free health tool
    │   ├── pricing health demo login signup forgot-password
    │   ├── auth/callback
    │   ├── r/[token]                   public report
    │   ├── (app)/app                   dashboard, clients, sites, reports, billing, settings
    │   └── api
    │       ├── cron health
    │       ├── billing/checkout
    │       ├── sites/[siteId]/run
    │       └── webhooks/{dodo,stripe}
    ├── components
    └── lib
```
