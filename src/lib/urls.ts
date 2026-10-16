const MULTI_PART_SUFFIXES = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "com.au",
  "net.au",
  "co.in",
  "com.br",
  "co.nz",
  "com.mx",
  "co.za",
  "com.sg",
]);

const RESERVED_SLUGS = new Set([
  "app",
  "api",
  "www",
  "r",
  "health",
  "pricing",
  "login",
  "signup",
  "auth",
  "billing",
  "docs",
  "demo",
  "invite",
  "dashboard",
  "mail",
  "ftp",
  "status",
  "admin",
  "preview",
  "setup",
]);

export function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!host) return true;
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "0.0.0.0"
  ) {
    return true;
  }
  if (!host.includes(".")) return true;

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    const c = Number(ipv4[3]);
    const d = Number(ipv4[4]);
    if ([a, b, c, d].some((n) => n > 255)) return true;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }

  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) {
    return true;
  }
  return false;
}

export function parsePublicUrl(input: string): URL {
  const trimmed = input.trim();
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProto);
  } catch {
    throw new Error("Enter a full URL, like https://client.framer.app");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs can be checked.");
  }
  if (url.username || url.password) {
    throw new Error("Remove the username and password from the URL.");
  }
  if (isPrivateHost(url.hostname)) {
    throw new Error("That host is private. RetainerSnap only checks public sites.");
  }
  url.hash = "";
  return url;
}

export function canonicalSiteUrl(url: URL): string {
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return `${url.origin}${path}`;
}

export function registrableDomain(hostname: string): string {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return host;
  const lastTwo = parts.slice(-2).join(".");
  if (MULTI_PART_SUFFIXES.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  return lastTwo;
}

export function safeNext(value: unknown, fallback = "/app"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return fallback;
  }
  return value;
}

export function validateSlug(slug: string): string | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 40) {
    return "Use 3–40 lowercase letters, numbers, and hyphens.";
  }
  if (RESERVED_SLUGS.has(slug)) return "That address is reserved.";
  return null;
}

export function appOrigin(appUrl: string, slug: string, useSlugHost: boolean) {
  if (!useSlugHost) return appUrl;
  try {
    const url = new URL(appUrl);
    if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) return appUrl;
    url.hostname = `${slug}.${url.hostname.replace(/^www\./, "")}`;
    return url.origin;
  } catch {
    return appUrl;
  }
}
