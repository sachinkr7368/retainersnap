export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "Not yet";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not yet";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function periodStartIso(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function periodLabel(periodStart: string): string {
  const date = new Date(`${periodStart.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return periodStart;
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function dollarsToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error("Enter a price like 350 or 350.00");
  }
  const cents = Math.round(Number(trimmed) * 100);
  if (cents > 100_000_000) throw new Error("That price is too large.");
  return cents;
}

export function formatDurationMs(value: number | null): string {
  if (value == null) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${Math.round(value)}ms`;
}

export function formatCls(value: number | null): string {
  if (value == null) return "—";
  return value.toFixed(2);
}

export function formatRatio(value: number | null): string {
  if (value == null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function platformLabel(platform: string): string {
  if (platform === "nextjs") return "Next.js";
  if (platform === "webflow") return "Webflow";
  if (platform === "framer") return "Framer";
  return platform;
}
