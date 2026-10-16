# Test checklist

Run `pnpm test` first. It checks private-host rejection, registrable domains, plan resolution (trial, expired trial, active Solo beating a trial, cancelled-but-not-ended, cancelled-and-ended, on-hold), and that the summary template names the host and the uptime percent. It does not call Google, Dodo, or Stripe.

Use a real inbox you can open. Supabase email confirmation should be on for the production pass and can be off for a faster local pass.

## Sign up

- [ ] `/signup` with a studio name, email, and a password of at least 8 characters.
- [ ] If confirmation is on, the page says to check email, and the link lands on `/auth/callback` then `/app`.
- [ ] `/app` shows the studio name, the Studio trial day count, and an empty sites state.
- [ ] A row exists in `workspaces` and `workspace_members` for that user.
- [ ] Sign out, sign in with the password, and sign in with the magic link.
- [ ] `/forgot-password` sends a reset link that returns to `/app/settings`, and the new password works.

## Add a site

- [ ] Add a client with a name. Blank contact email is allowed. A bad email is rejected.
- [ ] Add a site: public URL, platform Framer, Webflow, or Next.js.
- [ ] `http://127.0.0.1`, `localhost`, and `https://user:pass@example.com` are rejected.
- [ ] The same URL in the same workspace is rejected as a duplicate.
- [ ] The site page loads even if the queue insert failed. **Run checks now** can be used afterwards.

## Run checks

- [ ] **Run checks now** returns a processed count and the site page shows uptime, SSL, or domain rows after a refresh.
- [ ] Click again until PageSpeed and the crawl have run (each click finishes a few jobs; PageSpeed needs `PAGESPEED_API_KEY`).
- [ ] `pnpm cron:once` against the dev server returns 200. `POST /api/cron` without the bearer token returns 401.
- [ ] With `RESEND_API_KEY` set, a down site or a certificate inside 14 days emails the workspace owner. The same alert does not send again inside 24 hours.
- [ ] With `RESEND_API_KEY` empty, the check still saves and no email is attempted.

## Generate and share a report

- [ ] **Report for {month}** opens a draft. The summary mentions the hostname.
- [ ] Edit the summary, add a “work done” line, add a “recommended next” line with a price such as `350`, remove one line.
- [ ] A price of `abc` is rejected. A summary over 2000 characters is rejected.
- [ ] **Save as PDF** opens the print dialog and hides the editor chrome.
- [ ] Before publish, `/r/{token}` is a 404.
- [ ] Publish. Copy link. Open it in a private window. The report renders without a login.
- [ ] On the free plan (expire the trial in SQL, or wait it out) the public page shows “Powered by RetainerSnap” even if an older publish had branding.
- [ ] On Solo or Studio during the trial, the watermark is absent and the logo or studio name and colour show.

## Checkout and webhooks, both providers

Do Dodo and Stripe in test mode. Do not use live keys.

Dodo (`PAYMENT_PROVIDER=dodo`, `DODO_PAYMENTS_ENVIRONMENT=test_mode`):

- [ ] Billing → Subscribe monthly on Solo opens a Dodo checkout.
- [ ] Complete test checkout. Dodo posts to `/api/webhooks/dodo`.
- [ ] `subscriptions` has `provider=dodo`, `plan=solo`, `status=active`, and the workspace id from metadata.
- [ ] Send the same webhook again. The second delivery does not create a second row (`webhook_events` holds the id).
- [ ] A request with a bad `webhook-signature` returns 401.
- [ ] **Open billing portal** returns to Dodo’s customer portal.
- [ ] **Cancel at period end** sets `cancel_at_period_end`. The plan still works until `current_period_end`.
- [ ] Repeat once for Studio.

Stripe (`PAYMENT_PROVIDER=stripe`, `sk_test_...`, `stripe listen` forwarding):

- [ ] Subscribe monthly. Pay with `4242 4242 4242 4242`.
- [ ] `checkout.session.completed` and `customer.subscription.updated` write `provider=stripe`.
- [ ] A bad `stripe-signature` returns 401.
- [ ] Billing portal opens the Stripe test portal.
- [ ] Cancel at period end sets the flag in Stripe and in `subscriptions`.
- [ ] `customer.subscription.deleted` sets status `expired`, and the workspace falls through to the trial or Free.
- [ ] Set `PAYMENT_PROVIDER` back to `dodo` when the Stripe pass is done. The Stripe row still opens the Stripe portal.

## Plan limits

- [ ] On Free, after the trial timestamp is in the past, the third site insert fails with the upgrade message. SQL `insert_site` is what rejects it.
- [ ] Solo stops at 15 sites. Studio stops at 50.
- [ ] A non-owner hitting checkout gets 403.
- [ ] Studio invite of a second email sends a link. Accepting while signed in as that email switches the workspace cookie.
- [ ] A fourth seat on Studio is rejected. A second seat on Free or Solo is rejected.
- [ ] An invite opened from a different email shows the mismatch message.

## Free health tool

- [ ] `/` and `/health` render the form with no session.
- [ ] A public URL returns uptime, SSL, domain, and PageSpeed tiles, then a signup link that carries the URL to `/app/sites/new`.
- [ ] A private host returns 400 and does not call PageSpeed.
- [ ] The 9th request from the same IP inside the hour returns 429 and points at signup.
- [ ] With `PAGESPEED_API_KEY` or the service role missing, the route returns 503 and the marketing page still loads.
