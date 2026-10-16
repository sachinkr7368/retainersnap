# Tests

`pnpm test` runs `scripts/self-check.ts`. It checks plan resolution, public URL rejection, the summary template, the API envelope, and the production CSP. It does not call the network.

`pnpm test:e2e` runs Playwright against a local server with `ALLOW_PREVIEW=1`.

- `alignment.spec.ts` fails when pricing, home, health, or the sample report are misaligned.
- `visual.spec.ts` screenshots the public pages.
- `walkthrough.spec.ts` walks the public offer, a private URL, signup, and the missing-key setup page.
- `gallery.spec.ts` screenshots every mock screen under `/preview`.

Desktop is 1280×900. Mobile is a Pixel 5. Screenshot files land in `test-results` and are gitignored. CI uploads them as artifacts.
