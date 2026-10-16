# RetainerSnap

Follow [AGENTS.md](AGENTS.md). The architecture is [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The project skill is [.claude/skills/retainersnap/SKILL.md](.claude/skills/retainersnap/SKILL.md).

Hard rules:

- Next.js 15, not 16. TypeScript strict. Tailwind 4. Editorial tokens in `src/app/globals.css`. shadcn primitives in `src/components/ui`.
- One Zod schema per form, in `src/lib/validators.ts`. React Hook Form submits `FormData` to a server action that parses the same schema.
- Server Components load data. TanStack Query is only for the health, run-checks, and checkout mutations.
- JSON is `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.
- CSP stays nonce-based. No `unsafe-eval` in production. `/preview` stays off unless `ALLOW_PREVIEW=1`.
- Do not commit secrets. Do not touch Stripe products that lack `retainersnap_plan`. Do not run a live Stripe bootstrap unless asked.
- Run `pnpm typecheck`, `pnpm test`, and `pnpm test:e2e` before calling UI work done.
