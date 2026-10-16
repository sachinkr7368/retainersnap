# RetainerSnap

Monthly branded client reports for freelancers and small studios who maintain Framer, Webflow, and Next.js sites. The report is the reason a $300–800 retainer keeps getting paid.

The app is a Next.js 15 App Router project on TypeScript strict and Tailwind CSS 4. The git-linked host is Vercel. Cloudflare Workers through OpenNext remains an optional path, with a second Worker that can call `POST /api/cron` every five minutes. Data and auth are Supabase. Mail is Resend. PageSpeed is the Google PageSpeed Insights API. Payments sit behind `PaymentProvider`, with Dodo Payments as the default and Stripe as the other adapter (`PAYMENT_PROVIDER=dodo|stripe`). Report copy is a template. There is no paid AI.

The product architecture, security headers, API shape, and preview gallery are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Agent rules are in [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md).

## Architecture

```
browser ── Next.js (OpenNext Worker: retainersnap)
              ├─ Supabase Auth (email, magic link, reset) + Postgres with RLS
              ├─ service role for writes, after a membership check
              ├─ Resend for alerts and invites
              ├─ PageSpeed Insights, crt.sh, RDAP, and a 50-page crawl
              └─ PaymentProvider
                    ├─ Dodo (default): checkout, signed webhooks, cancel, customer portal
                    └─ Stripe: Checkout, signed webhooks, cancel, billing portal

Cloudflare Cron Worker (retainersnap-cron, */5 * * * *)
    POST /api/cron  Authorization: Bearer CRON_SECRET
        enqueue due jobs, then process up to 4
```

Checks are a queue (`check_jobs`). One job does one network call, so a Worker CPU slice is not asked to crawl 50 pages in one go. Uptime is an HTTP GET. SSL comes from crt.sh, because Workers cannot open a raw TLS socket. Domain expiry comes from `https://rdap.org`. PageSpeed runs monthly. The crawl stores its queue on `link_checks.crawl_state` and visits one same-origin page per job, up to 50.

The 14-day Studio trial is an app column, `workspaces.trial_ends_at`, set when the account is created. No card. A subscription grants its plan while status is `active`, `trialing`, or `past_due`, or `cancelled` with `current_period_end` still in the future. `on_hold` does not grant access. Otherwise an unexpired trial is Studio, and everything else is Free. The public report recomputes the watermark from the live plan.

Studio “custom domain” in this version is `{slug}.retainersnap.com` via a wildcard DNS record on the same Worker. Customer-owned hostnames need Cloudflare for SaaS, which is a paid add-on, and are not in this MVP.

Free plan reports always show “Powered by RetainerSnap”. Solo and Studio can upload a logo and set a colour. PDF is the browser print dialog.

## Folder tree

```
.
├── open-next.config.ts
├── wrangler.jsonc                      app worker
├── workers/cron/                       cron worker
├── supabase/migrations/0001_init.sql
├── scripts/self-check.ts
├── scripts/cron-once.ts
├── scripts/deploy.sh
├── docs/SETUP.md
├── docs/TEST-CHECKLIST.md
├── docs/LAUNCH.md
├── docs/COSTS.md
└── src
    ├── middleware.ts
    ├── app
    │   ├── page.tsx                    landing + free health tool
    │   ├── pricing health demo login signup forgot-password
    │   ├── auth/callback
    │   ├── invite/[token]
    │   ├── r/[token]                   public report
    │   ├── (app)/app                   dashboard, clients, sites, reports, billing, settings
    │   └── api
    │       ├── cron health
    │       ├── billing/checkout
    │       ├── sites/[siteId]/run
    │       └── webhooks/{dodo,stripe}
    ├── components
    └── lib
        ├── supabase payments checks email
        ├── plans session actions env
        └── validators urls summary
```

## Create and install

This directory is already the project. Do not run `create-next-app` inside it.

If `pnpm` is missing (corepack writing to `/usr/local` often fails without sudo):

```bash
npm install -g pnpm --prefix "$HOME/.local"
export PATH="$HOME/.local/bin:$PATH"
```

Install, including the native builds esbuild, workerd, and unrs-resolver:

```bash
cd /Users/sachin/Documents/RetainerSnap
export PATH="$HOME/.local/bin:$PATH"
pnpm install
cp .env.example .env.local
cp .env.example .env.production
```

Fill `.env.local` using [docs/SETUP.md](docs/SETUP.md). Each variable in `.env.example` says which dashboard it comes from.

## Run

```bash
export PATH="$HOME/.local/bin:$PATH"
pnpm dev          # http://localhost:3000
pnpm typecheck
pnpm test          # plan, URL, and summary checks. No network.
pnpm test:e2e      # Playwright. Public pages, the walkthrough, and the mock-data gallery.
pnpm cron:once     # needs the dev server and CRON_SECRET
```

`pnpm test:e2e` starts the app with `ALLOW_PREVIEW=1` and screenshots every public page plus every screen under `/preview`. Production builds leave that variable unset, so `/preview` 404s. Screenshot files are CI artifacts. They are not committed.

GitHub Actions (`.github/workflows/ci.yml`) runs typecheck, unit checks, and Playwright on every push to `main` and on pull requests, and uploads the screenshots. A push to `main` also deploys through the linked Vercel project. Stripe, the database, Vercel, and the optional Worker deploy are in [docs/PRODUCTION.md](docs/PRODUCTION.md).

Deploy and the domain steps are in [docs/SETUP.md](docs/SETUP.md). The test pass is [docs/TEST-CHECKLIST.md](docs/TEST-CHECKLIST.md). Launch copy is [docs/LAUNCH.md](docs/LAUNCH.md). What stays free, and when it stops, is [docs/COSTS.md](docs/COSTS.md).

## Plans

| Plan | Price | Sites | Seats | Branding | Uptime |
| --- | --- | --- | --- | --- | --- |
| Free | $0 | 2 | 1 | Watermark | Daily |
| Solo | $19/mo or $190/yr | 15 | 1 | Own logo and colours | Daily |
| Studio | $49/mo or $490/yr | 50 | 3 | Own brand, `{slug}.retainersnap.com` | Every 5 minutes |

New accounts get 14 days of Studio with no card. Limits are enforced in SQL (`insert_site`, `create_invite`) and again in the server actions.
