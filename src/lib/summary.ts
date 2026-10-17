import { formatDate } from "@/lib/format";

export function buildSummary(input: {
  hostname: string;
  periodLabel: string;
  uptimeRatio: number | null;
  sslExpiresAt: string | null;
  domainExpiresAt: string | null;
  brokenCount: number;
  performance: number | null;
}): string {
  const sentences: string[] = [];
  if (input.uptimeRatio == null) {
    sentences.push(`Uptime checks for ${input.hostname} have not run yet in ${input.periodLabel}.`);
  } else {
    sentences.push(
      `${input.hostname} was up ${(input.uptimeRatio * 100).toFixed(1)}% of checks in ${input.periodLabel}.`,
    );
  }
  if (input.sslExpiresAt) {
    const when = formatDate(input.sslExpiresAt);
    const expired = new Date(input.sslExpiresAt).getTime() < Date.now();
    sentences.push(expired ? `The certificate expired on ${when}.` : `SSL is valid through ${when}.`);
  } else {
    sentences.push("SSL expiry could not be confirmed from public certificate logs.");
  }
  if (input.domainExpiresAt) {
    sentences.push(`The domain is registered through ${formatDate(input.domainExpiresAt)}.`);
  }
  if (input.performance != null) {
    sentences.push(`Mobile performance scored ${input.performance}.`);
  }
  if (input.brokenCount > 0) {
    const noun = input.brokenCount === 1 ? "page" : "pages";
    sentences.push(`${input.brokenCount} ${noun} returned a broken response in the latest crawl.`);
  } else {
    sentences.push("No broken links were found in the latest crawl.");
  }
  return sentences.join(" ");
}
