# Launch kit

Ship the free health tool and one real client report before the posts. The landing page already uses the lines below.

## Landing

**Headline.** Monthly reports that keep the retainer.

**Subhead.** Freelancers and small studios on Framer, Webflow, and Next.js send one branded page a month: uptime, SSL, domain, PageSpeed, the work that got done, and a price for what is next. Clients paying $300–800 can see why they are paying.

**Primary button.** Start the 14-day Studio trial.

**Secondary.** See a sample report.

**Note under the buttons.** No card. Free plan stays at 2 sites.

**Health tool title.** Check a site, no account.

**FAQ, platform login.** RetainerSnap checks the public URL. It does not ask for a Webflow or Framer login.

**FAQ, free plan.** Two sites, forever, with “Powered by RetainerSnap” on the report.

**Pricing fine print.** The 14-day Studio trial does not need a card. Prices are in USD. Taxes are calculated at checkout.

**Billing, quiet line.** Checkout is processed by Dodo Payments, the merchant of record. (Swap the name only when `PAYMENT_PROVIDER=stripe`.)

Phrases to keep off the page: unlock, elevate, seamless, and any complaint about Stripe account reviews.

Search phrases worth a paragraph on the blog later, not as ads: “ManageWP alternative for Framer”, “ManageWP alternative for Webflow”, “Framer SSL not working”, “Webflow maintenance report template”.

## Seven posts for X

Post one a day, in this order. Attach a screenshot of the sample report or the health tool. No threads required.

1. I keep losing retainers because the client forgets what they pay for. Building RetainerSnap: one monthly page for a Framer or Webflow site. Uptime, SSL, the work I did, and a price for what is next.
2. The report is a link, not a login. Clients will not open another dashboard. They will open a page with their logo on it. Print to PDF if their accountant wants a file.
3. Shipped the free check. Paste a URL, get PageSpeed, SSL expiry, and domain expiry. No account. https://retainersnap.com/health
4. SSL for these sites is the one that bites people. Framer and Webflow both front a certificate the freelancer does not control. The report shows the date anyway, from public certificate logs, and emails when it is inside 14 days.
5. Free plan is 2 sites and a “Powered by RetainerSnap” line. Solo is $19 for 15 sites and your own brand. I do not want a freelancer’s first two clients to need a credit card.
6. The “recommended next” block is the part I care about. A $450 line for compressing the collection pages sits under the PageSpeed score. The retainer stays. The extra work has a price before the call.
7. Opening it up. 14 days of the Studio plan, no card, 50 sites. If you bill maintenance on Framer, Webflow, or Next.js, the sample report is here: https://retainersnap.com/demo

## Product Hunt

**Tagline.** Monthly client reports that keep your Framer & Webflow retainers alive.

**Description.**

RetainerSnap sends the monthly page a maintenance client will actually read. Add a public URL, tag it Framer, Webflow, or Next.js, and the app checks uptime, SSL expiry, and domain expiry. Once a month it stores a PageSpeed snapshot and crawls up to 50 pages for broken links. You write what you did, add a recommended next job with your price, and send a branded link. The client can print it to PDF.

Free for 2 sites, with a small RetainerSnap line on the report. Solo is $19/month for 15 sites and your logo. Studio is $49/month for 50 sites, 3 seats, and a report host on your slug. New accounts get 14 days of Studio, no card. No Webflow or Framer login. The check uses the public site.

**Maker comment.**

I bill retainers for Webflow and Framer sites and kept a spreadsheet of “what we did this month” that I sent as a PDF when I remembered. Clients who saw the page stayed. Clients who only got an invoice asked what the invoice was for.

RetainerSnap is that page, generated from checks I was already doing by hand: is it up, when does SSL die, when does the domain die, what does PageSpeed say, what did I fix, what should they buy next. The free plan is 2 sites so you can send a real report before you pay. I would love to see a report you would be willing to forward to a client, and what you would cut.

**Gallery plan.** Five images, in this order. 1270×760 or the current Product Hunt size. Real UI, paper background, no mock phone frames.

1. Landing hero with the headline and the URL field filled with a Framer URL.
2. Health result: four tiles (uptime, SSL date, domain date, performance score) and the signup panel.
3. Site page with the latest checks and the “Report for this month” button.
4. The report itself, logo and moss accent, work-done list, one priced recommendation. This is the image to pin first if PH only shows one.
5. Pricing: Free, Solo $19, Studio $49, with the “14-day Studio trial, no card” line visible.

**First comment to post under the launch, after the maker comment.** Link to `/demo` and `/health`. Offer to look at one live URL in the comments and say what the report would flag. Do not offer custom development.

## Kill criteria

These are a decision rule, not a feature.

- Fewer than 100 signups and fewer than 10 people with a site still checked, two weeks after Product Hunt.
- Fewer than 3 paying workspaces, or under $100 MRR, by day 45.
- More than half of free workspaces never send a second report.

If two of those are true, stop adding scope and talk to the people who did send a second report before writing more code.
