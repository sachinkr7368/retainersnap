#!/usr/bin/env bash
# Copy .env.production into Cloudflare Worker secrets.
# NEXT_PUBLIC_* must be present at runtime too: the server reads them dynamically.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="${HOME}/.local/bin:${PATH}"
file="${1:-.env.production}"
if [[ ! -f "$file" ]]; then
  echo "Missing $file" >&2
  exit 1
fi

tmp="$(mktemp)"
cron="$(mktemp)"
trap 'rm -f "$tmp" "$cron"' EXIT

node --input-type=module - "$file" "$tmp" "$cron" <<'JS'
import { readFileSync, writeFileSync } from "node:fs";
const [file, out, cronOut] = process.argv.slice(2);
const env = {};
for (const line of readFileSync(file, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
  const eq = trimmed.indexOf("=");
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (value) env[key] = value;
}
writeFileSync(out, JSON.stringify(env));
writeFileSync(cronOut, JSON.stringify({
  CRON_SECRET: env.CRON_SECRET || "",
  APP_URL: env.NEXT_PUBLIC_APP_URL || "",
}));
JS

pnpm exec wrangler secret bulk "$tmp"
pnpm exec wrangler secret bulk "$cron" --config workers/cron/wrangler.jsonc
echo "Worker secrets updated."
