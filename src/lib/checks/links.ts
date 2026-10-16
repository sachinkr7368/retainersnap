import { fetchChecked, readTextLimited } from "@/lib/checks/http";
import type { BrokenLink } from "@/lib/types";

const SKIP_EXT = /\.(png|jpe?g|gif|svg|webp|avif|css|js|mjs|pdf|zip|gz|mp4|webm|mp3|ico|woff2?|ttf|eot|xml|json)$/i;
const HREF = /href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi;

export type PageFetch = {
  ok: boolean;
  status: number | null;
  links: string[];
  error?: string;
};

export function extractLinks(html: string, pageUrl: string): string[] {
  let base: URL;
  try {
    base = new URL(pageUrl);
  } catch {
    return [];
  }
  const found = new Set<string>();
  for (const match of html.matchAll(HREF)) {
    const raw = (match[1] || match[2] || match[3] || "").trim();
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) {
      continue;
    }
    let next: URL;
    try {
      next = new URL(raw, base);
    } catch {
      continue;
    }
    if (next.protocol !== "http:" && next.protocol !== "https:") continue;
    if (next.hostname !== base.hostname) continue;
    if (SKIP_EXT.test(next.pathname)) continue;
    next.hash = "";
    next.search = "";
    if (next.pathname !== "/" && next.pathname.endsWith("/")) {
      next.pathname = next.pathname.replace(/\/+$/, "");
    }
    found.add(next.toString());
  }
  return [...found];
}

export async function fetchPage(url: string): Promise<PageFetch> {
  try {
    const response = await fetchChecked(url, 15_000);
    const contentType = response.headers.get("content-type") ?? "";
    const ok = response.status < 400;
    if (!ok || !contentType.includes("html")) {
      await response.body?.cancel().catch(() => undefined);
      return { ok, status: response.status, links: [] };
    }
    const html = await readTextLimited(response);
    return { ok: true, status: response.status, links: extractLinks(html, response.url || url) };
  } catch (error) {
    return {
      ok: false,
      status: null,
      links: [],
      error: error instanceof Error ? error.message : "Fetch failed",
    };
  }
}

export function asBroken(value: unknown): BrokenLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { url?: unknown; status?: unknown; error?: unknown };
    if (typeof row.url !== "string") return [];
    return [{
      url: row.url,
      status: typeof row.status === "number" ? row.status : null,
      error: typeof row.error === "string" ? row.error : undefined,
    }];
  });
}
