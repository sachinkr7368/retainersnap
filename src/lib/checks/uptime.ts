import { fetchChecked } from "@/lib/checks/http";

export type UptimeResult = {
  ok: boolean;
  statusCode: number | null;
  latencyMs: number | null;
  error?: string;
};

export async function runUptime(url: string): Promise<UptimeResult> {
  const started = Date.now();
  try {
    const response = await fetchChecked(url, 15_000);
    await response.body?.cancel().catch(() => undefined);
    return {
      ok: response.status < 400,
      statusCode: response.status,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      statusCode: null,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}
