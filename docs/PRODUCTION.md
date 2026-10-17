# Production

Local and the Vercel staging host stay in test mode. Production is a separate Vercel target. Fill that target with live values when you are ready to charge. The names match `.env.example`. The values are a different set.

`NEXT_PUBLIC_*` values are baked in at build time. A change applies on the next deploy of that target.

## The three places

| Place | Where it runs | Config |
| --- | --- | --- |
| Local | `pnpm dev` at `http://localhost:3000` | `.env.local`, test mode only |
| Staging | Preview deployment of the git branch `staging` | Vercel Preview, plus a staging-branch `NEXT_PUBLIC_APP_URL` |
| Production | Git branch `main` | Vercel Production target |

This Vercel account is on the Hobby plan, so it has no custom environment slot. Staging is the Preview deployment of `staging`.

- Staging: https://retainersnap-staging.vercel.app
- Production: https://retainersnap.vercel.app
- Dashboard: https://vercel.com/sachinkr-projects/retainersnap

Push to `staging` to ship a test-mode change. Push to `main` to ship production. Leave the staging deployment on Preview. Promoting it would publish the test build on the production alias.

## Already set for test mode

- `.env.local` is test mode. `PAYMENT_PROVIDER=stripe`. Keep it that way on this machine.
- Vercel Preview and Development hold the test Supabase project `snuhqzzeceanrgvupzju` (Mumbai), the Stripe test secret, the four Stripe test price ids, the Dodo test catalog (`DODO_PAYMENTS_ENVIRONMENT=test_mode`), and the test `CRON_SECRET`.
- Those variables are not on the Production target.
- The deployment already serving https://retainersnap.vercel.app still has the previous snapshot. It keeps answering until the next production deploy.
- The next deploy of `main` builds without the test database and the test payment keys. Set the production values below before you push to `main` or redeploy production.
- The test Supabase project site URL is the staging host. Redirects are `http://localhost:3000/auth/callback`, `http://127.0.0.1:3000/auth/callback`, and `https://retainersnap-staging.vercel.app/auth/callback`. Email confirmation stays off until Resend SMTP exists.
- The Stripe test webhook and the Dodo test webhook send events to the staging host.
- `ALLOW_PREVIEW` is unset, so `/preview` stays closed.
- Vercel Authentication and password protection are off on this project, so the staging host is public and Stripe and Dodo can deliver test webhooks. Leave them off for production too. A customer has to open the site without a Vercel login.
- `PAYMENT_PROVIDER=stripe` is set on Production as well, so a production build keeps Stripe as the checkout provider.
- Production already has `NEXT_PUBLIC_APP_URL=https://retainersnap.vercel.app` and `RESEND_FROM=RetainerSnap <onboarding@resend.dev>`.

Vercel Cron runs on production deployments only. On staging, call the route yourself:

```bash
curl -X POST https://retainersnap-staging.vercel.app/api/cron \
  -H "Authorization: Bearer $CRON_SECRET"
```

Use the test secret from `.env.local`. A missing or wrong bearer returns 401.

## Production values

In the Vercel project, add each value to the Production target. Leave Preview on the test values it already has.

### 1. A second Supabase project

Production uses its own Supabase project. The project `snuhqzzeceanrgvupzju` stays the test database.

1. Create a project in the Supabase dashboard.
2. Apply `supabase/migrations/0001_init.sql` once. From a checkout linked to that new ref: `pnpm db:apply`. The migration is not idempotent. Run it once.
3. Set the Auth site URL to the production origin. That is `https://retainersnap.vercel.app` until the domain is attached, then `https://retainersnap.com`.
4. Add one redirect: `https://<production-origin>/auth/callback`.
5. Leave email confirmation off until Resend SMTP is connected. The steps are in `docs/SETUP.md` section 3.
6. On the Vercel Production target, set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from that new project.

### 2. PageSpeed

Local and the staging Preview already have `PAGESPEED_API_KEY`. It lives in Google project `retainersnap-psi`, restricted to the PageSpeed Insights API, and it is not on the Production target. For production, create a separate key in that same project (`docs/SETUP.md` section 4) and set `PAGESPEED_API_KEY` on the Production target only. Until that production value exists, a new production deploy returns 503 from `/api/health`.

### 3. Mail

Create a Resend API key and set `RESEND_API_KEY` on Production. `RESEND_FROM` is already the shared test sender. After `retainersnap.com` is verified in Resend, change `RESEND_FROM` to an address on that domain, point the production Supabase project at Resend SMTP (`smtp.resend.com`, port 465, username `resend`), and turn email confirmation on. Until the key exists, report mail is stored and magic links use Supabase’s built-in mail, about two an hour.

### 4. Cron secret

Generate a new value for production. Keep the test secret in `.env.local` and on Preview.

```bash
openssl rand -hex 32
```

Set that new value as `CRON_SECRET` on the Production target. Vercel sends it as `Authorization: Bearer` to `POST /api/cron`. `vercel.json` schedules that route at `0 13 * * *` (13:00 UTC, once a day). Hobby accepts that daily job. Studio’s five-minute checks need Vercel Pro, with the schedule changed to `*/5 * * * *`, or the optional Cloudflare worker in `workers/cron`.

### 5. App URL

`NEXT_PUBLIC_APP_URL` on Production is `https://retainersnap.vercel.app`. After the domain answers, set it to `https://retainersnap.com` and redeploy production so checkout return URLs and auth links use that origin. No trailing slash.

`PAYMENT_PROVIDER` on Production is `stripe`. Leave it when new checkouts should open Stripe. Set it to `dodo` only when the live Dodo products below exist and you want new checkouts to open Dodo. Cancel and the customer portal follow the provider stored on the subscription row.

### 6. Stripe live

Run this after Stripe has enabled live charges on the account. Live charges are off today. Test checkout stays on the staging host.

```bash
STRIPE_SECRET_KEY=sk_live_... pnpm stripe:bootstrap -- --live
```

The command refuses a test key together with `--live`. It only creates or updates products whose metadata is `retainersnap_plan`. Every other product on the Stripe account stays as it is.

Put the live values on the Production target:

- `STRIPE_SECRET_KEY` (`sk_live_...`)
- `STRIPE_PRICE_SOLO_MONTHLY`
- `STRIPE_PRICE_SOLO_YEARLY`
- `STRIPE_PRICE_STUDIO_MONTHLY`
- `STRIPE_PRICE_STUDIO_YEARLY`
- `STRIPE_WEBHOOK_SECRET` from a new live endpoint

Live webhook URL: `https://<production-origin>/api/webhooks/stripe`

Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.

The live endpoint sends to the production origin. The test endpoint stays on the staging origin.

### 7. Dodo live

The key in `.env.local` is a test key. The live API rejects it.

1. Create a live API key in the Dodo dashboard.
2. Against `https://live.dodopayments.com`, create four recurring products: Solo $19 monthly, Solo $190 yearly, Studio $49 monthly, Studio $490 yearly. Tax category is SaaS. `subscription_period` is how long the subscription may last, so set it to 10 years. Payment frequency is 1 month or 1 year. Metadata is `retainersnap_plan` (`solo` or `studio`) and `retainersnap_interval` (`month` or `year`).
3. Create coupon `PH50`: 50 percent, 12 billing cycles.
4. Add a webhook at `https://<production-origin>/api/webhooks/dodo` for `subscription.active`, `subscription.updated`, `subscription.renewed`, `subscription.plan_changed`, `subscription.on_hold`, `subscription.cancelled`, `subscription.expired`, `subscription.failed`, and `subscription.past_due`.
5. On the Production target set `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`, `DODO_PAYMENTS_ENVIRONMENT=live_mode`, and the four live `DODO_PRODUCT_*` ids.

### 8. Support mail

Customers should write to `support@retainersnap.com`. That mailbox does not exist until you own the domain, so do not publish the address before the forwarder answers. The free forwarder is Cloudflare Email Routing, and it delivers to `sachin7368kr@gmail.com`. Customers never see that Gmail address.

After `retainersnap.com` is on Cloudflare:

1. Email → Email Routing → enable it and add the destination `sachin7368kr@gmail.com`. Confirm the message Google sends.
2. Create the custom address `support@retainersnap.com` and route it to that destination.
3. Add a footer link `mailto:support@retainersnap.com`.

ImprovMX’s free plan does the same job if the DNS is not on Cloudflare. There is no free inbox on a domain you do not own yet.

### 9. Domain

Buy `retainersnap.com` when you want the name. In the Vercel project attach `retainersnap.com`, `www.retainersnap.com`, and `*.retainersnap.com`. Then set the production `NEXT_PUBLIC_APP_URL`, the production Supabase site URL, and the production Supabase callback, and redeploy production. Studio slug hosts (`{slug}.retainersnap.com`) wait on this domain.

### 10. Redeploy production

Redeploy production after the Production target has the live Supabase keys, the new cron secret, the live payment keys, and the app URL. A push to `main` does that deploy. Until those values exist, leave the current production deployment in place.

Leave `ALLOW_PREVIEW` unset. Leave Deployment Protection off on the production URL so a customer can open the site.

Web Analytics and Speed Insights are mounted in the root layout. Turn them on if the dashboard still shows them off:

- https://vercel.com/sachinkr-projects/retainersnap/analytics
- https://vercel.com/sachinkr-projects/retainersnap/speed-insights

## Cloudflare

Vercel is the host for this setup. `pnpm deploy`, `pnpm secrets:push`, and `pnpm deploy:cron` are the optional Cloudflare path in `docs/SETUP.md`. They are separate from the Vercel Production target.
