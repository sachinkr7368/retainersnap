# What stays free, and when it starts costing

Figures are list prices as of the build. Check the vendor page before you pay. Nothing here is a bill you already owe.

| Piece | Free tier | When it starts costing |
| --- | --- | --- |
| Cloudflare Workers (app) | About 100,000 requests a day on the free plan. Cron triggers exist, with a small number of cron schedules (about 5). CPU time per request is short (about 10 ms). | **$5/month Workers Paid**, expected before production PageSpeed and before Studio’s 5-minute checks have more than a handful of sites. A PageSpeed call plus certificate and RDAP lookups will not fit the free CPU budget once real clients are attached. Also the point where daily request volume from the cron (sites × jobs) gets uncomfortable. |
| Cloudflare Registrar | — | **retainersnap.com is about $11/year** from the moment you register it. DNS on Cloudflare stays free. |
| Cloudflare for SaaS | Not used. Studio v1 is `{slug}.retainersnap.com` on a wildcard route. | Custom hostnames on the customer’s own domain are a paid SaaS product. Do not turn this on for the MVP. |
| Supabase | Free project: Postgres, auth, storage, and the API. The project **pauses after about 7 days without activity**. | **Pro is about $25/month** when you cannot accept a pause, or when you pass the free database, auth, or storage caps. A paused project makes checks and login fail until you restore it. |
| Resend | About **3,000 emails/month and 100/day** on the free plan. | About **$20/month** once alerts and invite mail pass that. Auth mail goes through the same account if SMTP points at Resend. |
| Google PageSpeed Insights API | Free quota for `pagespeedonline.googleapis.com`. A key is required either way. | Google does not charge a typical MVP for this API. The cost shows up as **Worker CPU** (see Workers Paid), not as a PageSpeed invoice. |
| Dodo Payments | Test mode is free. No monthly fee for holding the account. | **When a customer pays.** Dodo is the merchant of record. Pricing is on their site; budget roughly **4% + $0.40, plus a small currency fee**, taken from the charge. You do not pay this on free users. |
| Stripe | Test mode is free. | **When a customer pays**, if you set `PAYMENT_PROVIDER=stripe`. Stripe’s card fee is their standard rate for the country of the account. Invite-only availability is why Dodo is the default. Leave Stripe in test mode until an account is actually approved. |
| Domain email / Resend domain | `onboarding@resend.dev` works before the domain verifies. | Verifying `retainersnap.com` on Resend is free. You pay only if you outgrow the email tier above. |
| OpenNext, Next.js, Tailwind, the database itself | The libraries are free. | No license fee. |

## Practical order of first invoices

1. Domain, about $11, the day you register `retainersnap.com`. You can launch on `*.workers.dev` and pay this later.
2. Workers Paid, $5/month, the week you point real sites at PageSpeed or turn on 5-minute Studio checks.
3. Supabase Pro, $25/month, the week a pause would take the product offline. Restore a paused free project from the dashboard before you pay, if you are still testing.
4. Resend, about $20/month, after roughly 100 emails in a day or 3,000 in a month.
5. Dodo’s percentage, only on money customers pay you. At $19 Solo that is a few dollars per subscription, not a platform bill.

Free users, the health tool (8 runs an hour per IP), and the 14-day trial do not create a Dodo or Stripe charge. They do count toward Worker requests, Supabase rows, PageSpeed quota, and Resend mail when alerts send.
