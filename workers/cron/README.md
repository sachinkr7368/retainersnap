# Cron worker

Optional Cloudflare worker. Every five minutes it POSTs to `/api/cron` with `Authorization: Bearer CRON_SECRET`.

The Vercel project uses a daily cron in `vercel.json`, which is what a Hobby plan allows. Use this worker, or a Vercel Pro schedule of `*/5 * * * *`, when Studio’s five-minute checks need to run on the host.

```bash
pnpm deploy:cron
```

`APP_URL` and `CRON_SECRET` are secrets on the worker, not in git.
