import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Cache interception stays off. Next.js 16 plus OpenNext interception has a
// known prefetch loop; this app is on Next 15 and does not need it.
const config = defineCloudflareConfig({});

export default config;
