# Setup

Do these in order. Do not buy a paid add-on until [COSTS.md](COSTS.md) says you need it. Commands assume:

```bash
export PATH="$HOME/.local/bin:$PATH"
cd /Users/sachin/Documents/RetainerSnap
```

## 1. Supabase

1. Open <https://supabase.com/dashboard> and create a project. The free plan is enough to start. Pick a region close to you. Save the database password somewhere you control.
2. When the project is ready, open **Project Settings → Data API**. Copy the Project URL into `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` and `.env.production`.
3. Open **Project Settings → API keys**. Copy the `anon` `public` key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Copy the `service_role` `secret` into `SUPABASE_SERVICE_ROLE_KEY`. The service role bypasses row-level security. It never goes in a `NEXT_PUBLIC_` variable.
4. Open **SQL Editor → New query**. Paste the whole file `supabase/migrations/0001_init.sql` and run it. That creates tables, indexes, the signup trigger, plan-limit functions, and RLS.
5. If the storage block at the bottom errors on `allowed_mime_types`, the rest of the script has already run. In **Storage**, create a public bucket named `branding`, 1 MB max, MIME types `image/png`, `image/jpeg`, `image/webp`. Then run only the four `create policy branding_*` statements from the bottom of the migration.
6. Open **Authentication → URL configuration**.
   - Site URL: `http://localhost:3000` while you develop. Change it to `https://retainersnap.com` before launch.
   - Redirect URLs: `http://localhost:3000/auth/callback` and `https://retainersnap.com/auth/callback`.
7. Open **Authentication → Sign In / Providers → Email**. Leave email and password on. Turn **Confirm email** on for production. For local experiments you can leave it off so signup returns a session immediately.
8. Open **Authentication → Emails → SMTP settings**. The built-in sender is capped at about 2 emails an hour and is not meant for customers. Use Resend after step 3:
   - Host `smtp.resend.com`
   - Port `465`
   - Username `resend`
   - Password: the Resend API key (the same value as `RESEND_API_KEY`)
   - Sender: `RetainerSnap <onboarding@resend.dev>` until your domain is verified, then `RetainerSnap <reports@retainersnap.com>`

Signup inserts a personal workspace from the `studio_name` metadata, with `trial_ends_at` 14 days out. That trigger lives in the SQL file. If an account has no workspace, the SQL did not finish.

## 2. Cloudflare account and Wrangler

1. Create a free account at <https://dash.cloudflare.com/sign-up>.
2. Install is already a dev dependency. Log in:

   ```bash
   pnpm exec wrangler login
   ```

3. Generate the cron secret and put it in both env files as `CRON_SECRET`:

   ```bash
   openssl rand -hex 32
   ```

4. Workers secrets are not read from `.env.production` at runtime. After the first deploy (step 8), set them on the app worker. Run each command and paste the value when asked:

   ```bash
   pnpm exec wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   pnpm exec wrangler secret put CRON_SECRET
   pnpm exec wrangler secret put RESEND_API_KEY
   pnpm exec wrangler secret put PAGESPEED_API_KEY
   pnpm exec wrangler secret put DODO_PAYMENTS_API_KEY
   pnpm exec wrangler secret put DODO_PAYMENTS_WEBHOOK_KEY
   pnpm exec wrangler secret put STRIPE_SECRET_KEY
   pnpm exec wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

   Non-secret config can be secrets too, so the Worker sees them without a rebuild. Put these the same way if you do not want them only at build time:

   `RESEND_FROM`, `PAYMENT_PROVIDER`, `DODO_PAYMENTS_ENVIRONMENT`, `DODO_PRODUCT_SOLO_MONTHLY`, `DODO_PRODUCT_SOLO_YEARLY`, `DODO_PRODUCT_STUDIO_MONTHLY`, `DODO_PRODUCT_STUDIO_YEARLY`, `STRIPE_PRICE_SOLO_MONTHLY`, `STRIPE_PRICE_SOLO_YEARLY`, `STRIPE_PRICE_STUDIO_MONTHLY`, `STRIPE_PRICE_STUDIO_YEARLY`.

   `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are baked in by `pnpm deploy`. They must be in `.env.production` before the build. Changing them later requires another deploy.

5. Cron worker, separate from the app. Set the secret and the app URL, then deploy:

   ```bash
   pnpm exec wrangler secret put CRON_SECRET --config workers/cron/wrangler.jsonc
   ```

   In the Cloudflare dashboard, open the `retainersnap-cron` worker → **Settings → Variables** and add `APP_URL` = `https://retainersnap.com` (no trailing slash). The cron route is already `*/5 * * * *` in `workers/cron/wrangler.jsonc`.

## 3. Resend

1. Sign up at <https://resend.com/signup>. The free plan covers the first emails.
2. **API Keys → Create API key**. Put it in `RESEND_API_KEY`.
3. Leave `RESEND_FROM` as `RetainerSnap <onboarding@resend.dev>` until the domain verifies.
4. After you own `retainersnap.com` (step 7), **Domains → Add domain**, add the DNS records Resend shows (they can live on Cloudflare DNS), then set `RESEND_FROM` to `RetainerSnap <reports@retainersnap.com>`.
5. Paste the same API key into Supabase SMTP (step 1.8).

If `RESEND_API_KEY` is empty, alerts are stored and not sent.

## 4. PageSpeed key

1. Open <https://console.cloud.google.com/> and create a project.
2. Enable **PageSpeed Insights API**: <https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com>.
3. **APIs & Services → Credentials → Create credentials → API key**.
4. Restrict the key to the PageSpeed Insights API.
5. Put it in `PAGESPEED_API_KEY`.

The free health tool and monthly snapshots both use this key. Without it, `/api/health` returns 503 and PageSpeed jobs are not enqueued. The default Google quota is enough for the MVP. A large crawl of PSI calls is the thing that pushes you to Workers Paid, because each call can run longer than the free Worker CPU budget. See [COSTS.md](COSTS.md).

## 5. Dodo Payments (default)

1. Create an account at <https://app.dodopayments.com> (docs at <https://docs.dodopayments.com>). Stay in test mode.
2. **Developer → API keys**. Put the test key in `DODO_PAYMENTS_API_KEY`.
3. Set `DODO_PAYMENTS_ENVIRONMENT=test_mode` and `PAYMENT_PROVIDER=dodo`.
4. Create four subscription products, or two if you want monthly only:
   - Solo monthly, USD 19 → `DODO_PRODUCT_SOLO_MONTHLY`
   - Solo yearly, USD 190 → `DODO_PRODUCT_SOLO_YEARLY` (optional)
   - Studio monthly, USD 49 → `DODO_PRODUCT_STUDIO_MONTHLY`
   - Studio yearly, USD 490 → `DODO_PRODUCT_STUDIO_YEARLY` (optional)
5. **Developer → Webhooks**. Endpoint `https://<your-host>/api/webhooks/dodo`. Subscribe to subscription events: `subscription.active`, `subscription.updated`, `subscription.renewed`, `subscription.plan_changed`, `subscription.on_hold`, `subscription.cancelled`, `subscription.expired`, `subscription.failed`, and the past-due event if the dashboard lists it. Put the signing secret in `DODO_PAYMENTS_WEBHOOK_KEY`.
6. For local webhook tests, Dodo cannot see `localhost`. Use a Cloudflare quick tunnel or deploy to `*.workers.dev` first, and point the webhook at `https://<that-host>/api/webhooks/dodo`.
7. Optional: create a coupon `PH50` for 50% off the first year. The billing page mentions it. The app does not hard-code the discount.
8. When you go live, switch the dashboard to live mode, create live products, set `DODO_PAYMENTS_ENVIRONMENT=live_mode`, and replace the key, webhook secret, and product ids. Dodo is the merchant of record.

## 6. Stripe test mode

Use this when you want the second adapter. Checkout follows `PAYMENT_PROVIDER`. A subscription that was created on Stripe keeps using Stripe for the portal and cancellation, even if the env default is Dodo.

1. Open <https://dashboard.stripe.com> and stay in **Test mode** (the switch in the dashboard).
2. **Developers → API keys**. Put the secret key (`sk_test_...`) in `STRIPE_SECRET_KEY`. Do not put the publishable key anywhere. This app does not use it.
3. **Product catalogue**. Create Solo and Studio, each with a monthly recurring price of $19 and $49. Optional yearly prices of $190 and $490. Copy each `price_...` id into:
   - `STRIPE_PRICE_SOLO_MONTHLY`
   - `STRIPE_PRICE_SOLO_YEARLY`
   - `STRIPE_PRICE_STUDIO_MONTHLY`
   - `STRIPE_PRICE_STUDIO_YEARLY`
4. To test locally:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   The CLI prints a `whsec_...` secret. Put that in `STRIPE_WEBHOOK_SECRET` for local. For production, **Developers → Webhooks → Add endpoint** `https://retainersnap.com/api/webhooks/stripe`, events `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Use that endpoint’s signing secret in production.
5. Set `PAYMENT_PROVIDER=stripe` only for the Stripe test. Put it back to `dodo` afterwards. Card `4242 4242 4242 4242` is Stripe’s test card.

## 7. Buy retainersnap.com on Cloudflare Registrar

Do this when you are ready to pay for the domain (about $11 a year). The app runs on `*.workers.dev` before that.

1. <https://dash.cloudflare.com> → **Domain registration → Register domain**.
2. Search `retainersnap.com`. Register it for one year. Turn auto-renew on if you want.
3. Cloudflare creates the DNS zone. Stay on the free DNS plan.
4. After the app worker is deployed, **Workers & Pages → retainersnap → Settings → Domains & Routes → Add**:
   - `retainersnap.com`
   - `www.retainersnap.com` (redirect www to the apex in **Rules → Redirect rules** if you want one host)
   - `*.retainersnap.com` so Studio slugs resolve
5. Set `NEXT_PUBLIC_APP_URL=https://retainersnap.com` and redeploy so share links and auth redirects use the real host.
6. Update the Supabase site URL and redirect allow-list to `https://retainersnap.com` and `https://retainersnap.com/auth/callback`.

Customer-owned domains (a studio using `reports.theirsite.com`) are not part of this setup. That needs Cloudflare for SaaS.

## 8. Run locally, deploy, connect the domain

Local:

```bash
cp .env.example .env.local
# fill the values from the steps above
pnpm install
pnpm dev
```

Open <http://localhost:3000>. With the three Supabase variables empty, marketing pages still render and `/app` tells you which keys are missing.

Checks:

```bash
pnpm typecheck
pnpm test
```

In another terminal, with the dev server up and `CRON_SECRET` set:

```bash
pnpm cron:once
```

Deploy the app, then the cron worker:

```bash
# .env.production must contain the NEXT_PUBLIC_* values and the product ids you want inlined
pnpm deploy
pnpm deploy:cron
```

Then add the secrets from step 2.4 and the cron `APP_URL` from step 2.5. Attach `retainersnap.com` and `*.retainersnap.com` from step 7.4.

Confirm:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://retainersnap.com/pricing
curl -s -X POST https://retainersnap.com/api/cron
# expect 401
```

A 401 on `/api/cron` means the route is up and the secret check is working.
