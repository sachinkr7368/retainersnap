# Production copy

Local test mode and production use the same names. You change the values, not the code.

The linked host is Vercel. Pushing `main` deploys the Next.js app. `vercel.json` schedules `POST /api/cron` once a day at 13:00 UTC, which is the schedule a Hobby project accepts. Studio’s five-minute checks need a Vercel Pro cron (`*/5 * * * *`) or the optional Cloudflare cron worker in `workers/cron`. Set `CRON_SECRET` on the Vercel project. The route rejects any other bearer token.

Vercel Web Analytics and Speed Insights are mounted in the root layout. Turn both on in the project settings if the dashboard still shows them as off. Do not enable Deployment Protection or Attack Challenge Mode on the production URL. A customer has to open the site without a Vercel login.

Copy the names from `.env.example` into the Vercel project. `NEXT_PUBLIC_*` values are inlined at build time. Leave `ALLOW_PREVIEW` unset on Vercel so `/preview` stays off. Do not commit `.env.local` or `.env.production`.

The Cloudflare workflow (`.github/workflows/deploy.yml`) is a manual fallback. It is not required for the Vercel deployment.

## 1. Database

The schema is `supabase/migrations/0001_init.sql`. One project for local development and a second project for production is the safe split. The SQL file is identical.

```bash
supabase login
supabase link --project-ref <ref from the Supabase dashboard>
pnpm db:apply
```

`pnpm db:apply` runs `supabase db push`, which applies `supabase/migrations/0001_init.sql` once and records it. The same command is what production uses.

If the storage block errors on `allowed_mime_types`, create the public `branding` bucket in the dashboard (1 MB, png/jpeg/webp) and run the four `branding_*` policies at the bottom of the migration. Auth URLs and Resend SMTP are in `docs/SETUP.md`.

## 2. Stripe

Test mode (what you click through before launch):

```bash
pnpm stripe:bootstrap
pnpm stripe:listen
```

`stripe:bootstrap` creates Solo ($19 / $190) and Studio ($49 / $490), the PH50 coupon, and a billing portal, then writes the price ids into `.env.local`. It only touches products whose metadata is `retainersnap_plan`. Other products in the same Stripe account are left alone.

`stripe:listen` prints a `whsec_` signing secret. Put it in `STRIPE_WEBHOOK_SECRET` in `.env.local` while the listener is running.

Production, after the domain answers HTTPS:

```bash
STRIPE_SECRET_KEY=sk_live_... pnpm stripe:bootstrap -- --live
```

That writes `.env.production`. Then in the Stripe dashboard add a webhook endpoint `https://retainersnap.com/api/webhooks/stripe` for:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Put that endpoint’s signing secret in `STRIPE_WEBHOOK_SECRET`. Checkout already allows the promotion code `PH50`.

`PAYMENT_PROVIDER=stripe` selects Stripe for new checkouts. A subscription created on Dodo still opens the Dodo portal.

## 3. Deploy

Fill `.env.production` (the bootstrap writes the Stripe half). Then:

```bash
pnpm deploy
pnpm secrets:push
pnpm deploy:cron
```

`secrets:push` loads every non-empty value from `.env.production` onto the app worker, and `CRON_SECRET` plus `APP_URL` onto the cron worker. GitHub Actions does the same thing from repository secrets when you run the **Deploy** workflow by hand. The secret names match the env names in `.env.example`, plus `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

Attach `retainersnap.com` and `*.retainersnap.com` after you buy the domain. Set `NEXT_PUBLIC_APP_URL` to that origin and deploy once more so links and auth redirects use it.

## 4. What “ready” means before you post

- `pnpm typecheck`, `pnpm test`, and `pnpm test:e2e` are green.
- A real signup creates a workspace (the SQL trigger is in the migration).
- A test card `4242 4242 4242 4242` flips the workspace to Solo.
- A published report opens in a private window.
