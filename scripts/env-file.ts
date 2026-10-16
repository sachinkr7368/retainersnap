import { readFileSync, writeFileSync, existsSync } from "node:fs";

export function upsertEnv(path: string, values: Record<string, string>) {
  const lines = existsSync(path) ? readFileSync(path, "utf8").split("\n") : [];
  const seen = new Set<string>();
  const next = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return line;
    const key = trimmed.slice(0, trimmed.indexOf("=")).trim();
    if (!(key in values)) return line;
    seen.add(key);
    return `${key}=${quote(values[key])}`;
  });
  for (const [key, value] of Object.entries(values)) {
    if (seen.has(key)) continue;
    next.push(`${key}=${quote(value)}`);
  }
  writeFileSync(path, `${next.filter((line, index) => !(index === next.length - 1 && line === "")).join("\n")}\n`);
}

function quote(value: string): string {
  if (value === "") return "";
  if (/^[A-Za-z0-9_./:@+-]+$/.test(value)) return value;
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
