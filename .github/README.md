# GitHub Actions

`workflows/ci.yml` runs on pushes to `main` and on pull requests. It installs with pnpm 12.14.0, typechecks, runs `pnpm test`, then Playwright with Chromium. Reports and screenshots upload as artifacts for 14 days.

`workflows/deploy.yml` is the optional Cloudflare deploy. Run it by hand. The customer-facing deploy is the linked Vercel project, which builds `main` on every push.
