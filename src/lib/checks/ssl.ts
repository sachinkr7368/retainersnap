import { registrableDomain } from "@/lib/urls";

export type SslResult = {
  ok: boolean;
  expiresAt: string | null;
  issuer: string | null;
  error?: string;
};

type CrtRow = {
  not_after?: string;
  common_name?: string;
  name_value?: string;
  issuer_name?: string;
};

function hostMatches(row: CrtRow, hostname: string): boolean {
  const names = `${row.common_name ?? ""}\n${row.name_value ?? ""}`
    .toLowerCase()
    .split(/\n+/)
    .map((name) => name.trim())
    .filter(Boolean);
  return names.some((name) => {
    if (name.startsWith("*.")) {
      const suffix = name.slice(1);
      return hostname.endsWith(suffix) && hostname !== suffix.slice(1);
    }
    return name === hostname;
  });
}

function parseCrtDate(value: string): Date | null {
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function queryCrt(query: string): Promise<CrtRow[]> {
  const response = await fetch(`https://crt.sh/?q=${encodeURIComponent(query)}&output=json`, {
    signal: AbortSignal.timeout(20_000),
    headers: { accept: "application/json", "user-agent": "RetainerSnapBot/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Certificate log returned ${response.status}`);
  }
  const text = await response.text();
  if (!text.trim().startsWith("[") && !text.trim().startsWith("{")) {
    throw new Error("Certificate log did not return JSON");
  }
  const parsed = JSON.parse(text) as CrtRow[] | CrtRow;
  return Array.isArray(parsed) ? parsed : [parsed];
}

async function liveCertificate(hostname: string): Promise<SslResult | null> {
  try {
    const { connect } = await import("node:tls");
    return await new Promise((resolve) => {
      const socket = connect({ host: hostname, port: 443, servername: hostname, timeout: 10_000 }, () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        const expires = cert?.valid_to ? new Date(cert.valid_to) : null;
        if (!expires || Number.isNaN(expires.getTime())) {
          resolve(null);
          return;
        }
        const issuer = cert.issuer?.O || cert.issuer?.CN || null;
        resolve({
          ok: expires.getTime() > Date.now(),
          expiresAt: expires.toISOString(),
          issuer: typeof issuer === "string" ? issuer : null,
        });
      });
      const giveUp = () => {
        socket.destroy();
        resolve(null);
      };
      socket.on("error", giveUp);
      socket.on("timeout", giveUp);
    });
  } catch {
    return null;
  }
}

export async function runSsl(hostname: string): Promise<SslResult> {
  const host = hostname.toLowerCase();
  const live = await liveCertificate(host);
  if (live) return live;
  try {
    let rows = await queryCrt(host);
    const matched = rows.filter((row) => hostMatches(row, host));
    const usable = matched.length > 0 ? matched : rows.filter((row) => hostMatches(row, host));
    if (usable.length === 0) {
      const parent = registrableDomain(host);
      if (parent !== host) {
        rows = await queryCrt(parent);
      }
    }
    const pool = (usable.length > 0 ? usable : rows).filter((row) => hostMatches(row, host));
    let best: { date: Date; issuer: string | null } | null = null;
    for (const row of pool) {
      if (!row.not_after) continue;
      const date = parseCrtDate(row.not_after);
      if (!date) continue;
      if (!best || date > best.date) {
        best = { date, issuer: row.issuer_name ?? null };
      }
    }
    if (!best) {
      return { ok: false, expiresAt: null, issuer: null, error: "No public certificate was found for this site." };
    }
    const ok = best.date.getTime() > Date.now();
    return { ok, expiresAt: best.date.toISOString(), issuer: best.issuer };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "SSL lookup failed");
  }
}
