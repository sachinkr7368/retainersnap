# What is left before launch

Test mode is wired for local (`http://localhost:3000`) and for the Vercel staging host:

https://retainersnap-git-staging-sachinkr-projects.vercel.app

That host is the Preview deployment of the git branch `staging`. Hobby has no custom environment, so this preview is the staging site.

Production is https://retainersnap.vercel.app. Its Vercel Production target is waiting for a separate live config. The steps are `docs/PRODUCTION.md`. The deployment that is already serving that URL still has the previous snapshot. The next deploy of `main` builds without the test database and the test payment keys, so set the production values in `docs/PRODUCTION.md` first.

`PAYMENT_PROVIDER` stays `stripe`. New checkouts open Stripe test mode on local and on staging. A Dodo subscription still uses the Dodo portal.

These test-mode pieces are done.

- Supabase project `snuhqzzeceanrgvupzju` (Mumbai). Migration `0001` is applied. The site URL is the staging host. Localhost callbacks are allowed. Email confirmation is off until Resend SMTP exists.
- Stripe test catalog: Solo $19 / $190, Studio $49 / $490, coupon `PH50`. The test webhook sends to the staging host.
- Dodo test catalog, same four prices, coupon `PH50` for 12 billing cycles, `DODO_PAYMENTS_ENVIRONMENT=test_mode`. The test webhook sends to the staging host.
- `CRON_SECRET` is in `.env.local` and on Vercel Preview. Vercel Cron itself runs on production deployments, daily at 13:00 UTC, and needs the production secret from `docs/PRODUCTION.md`.
- `ALLOW_PREVIEW` is unset. `/preview` stays closed.
- PageSpeed. Google project `retainersnap-psi` has the PageSpeed Insights API enabled. `PAGESPEED_API_KEY` is in `.env.local` and on Vercel Preview and Development. It is not on the Production target. Local health and the x.com report scores use that key.
- Resend. A send-only `RESEND_API_KEY` is in `.env.local` and on Vercel Preview and Development. `RESEND_FROM` is `RetainerSnap <onboarding@resend.dev>` until a domain is verified. That shared sender delivers to the Resend account address.

## Still blocked on accounts you create

1. The domain `retainersnap.com`, when you want the name. Studio slug hosts wait on it. A verified domain is also what lets Resend send from `reports@retainersnap.com`.
2. Stripe live charges. The account has live charges disabled. After Stripe enables them, follow `docs/PRODUCTION.md` section 6. The bootstrap only touches products whose metadata is `retainersnap_plan`.
3. A Dodo live API key and live product ids. The current key is test-only. Follow `docs/PRODUCTION.md` section 7.
4. Five-minute checks. Hobby runs the daily cron. Studio’s five-minute schedule needs Vercel Pro or `workers/cron`.
