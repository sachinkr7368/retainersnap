type CronEnv = {
  APP_URL: string;
  CRON_SECRET: string;
};

export default {
  async scheduled(_controller: unknown, env: CronEnv, ctx: ExecutionContext) {
    const url = new URL("/api/cron", env.APP_URL);
    ctx.waitUntil(
      fetch(url, {
        method: "POST",
        headers: { authorization: `Bearer ${env.CRON_SECRET}` },
      }),
    );
  },

  async fetch() {
    return new Response("retainersnap cron worker", { status: 200 });
  },
};
