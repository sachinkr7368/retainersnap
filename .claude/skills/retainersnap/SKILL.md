---
name: retainersnap
description: Conventions for the RetainerSnap product. Use when editing this repo, adding a screen, a form, an API route, a test, or a deploy change.
---

# RetainerSnap

Monthly client reports for Framer, Webflow, and Next.js retainers. Read `AGENTS.md` and `docs/ARCHITECTURE.md` before a large change.

## When you change the product

1. Keep plan rules in `src/lib/plans.ts`. Free is watermarked. `on_hold` does not grant access. Trial is an app column, not a card.
2. Add or extend a schema in `src/lib/validators.ts`. Build the form in `src/components/forms.tsx` with React Hook Form. The server action parses that same schema and returns `ActionState`.
3. Return JSON from `apiOk` / `apiError`. Map errors to a short code and a sentence a customer can read.
4. Put new visual primitives in `src/components/ui` and style them with the paper, ink, and moss tokens. Controls that submit or navigate are `h-11`.
5. If the screen needs a screenshot without Supabase, add a fixture and a `previewShots` id. The gallery spec picks it up.
6. Leave Server Components in charge of reads. Use TanStack Query only when a client island calls a route handler.

## Checks before you finish

`pnpm typecheck`, `pnpm test`, and `pnpm test:e2e`. Playwright must stay green on desktop and mobile, including the pricing baseline and the preview gallery.

## Leave alone

Secrets, `.env.local`, live Stripe mode, and Stripe products that are not `retainersnap_plan`. Do not set `ALLOW_PREVIEW` on Vercel. Do not upgrade Next.js to 16.
