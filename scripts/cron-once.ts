import { existsSync, readFileSync } from "node:fs";

function loadEnv(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv(".env.local");
loadEnv(".env");

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const secret = process.env.CRON_SECRET ?? "";
if (!secret) {
  console.error("Set CRON_SECRET in .env.local. The dev server must already be running.");
  process.exit(1);
}

const response = await fetch(`${appUrl}/api/cron`, {
  method: "POST",
  headers: { authorization: `Bearer ${secret}` },
});
const text = await response.text();
console.log(response.status, text);
if (!response.ok) process.exit(1);
