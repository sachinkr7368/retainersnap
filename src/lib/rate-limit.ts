import "server-only";

import { createHash } from "node:crypto";
import { createAdmin } from "@/lib/supabase/admin";

const HOURLY_LIMIT = 8;

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

export async function consumeHealthQuota(request: Request) {
  const hash = createHash("sha256").update(`retainersnap:${clientIp(request)}`).digest("hex");
  const admin = createAdmin();
  const { data, error } = await admin.rpc("bump_tool_rate", { p_hash: hash });
  if (error) {
    throw new Error("Rate limit storage is not ready. Run supabase/migrations/0001_init.sql.");
  }
  const hits = typeof data === "number" ? data : Number(data);
  if (!Number.isFinite(hits) || hits > HOURLY_LIMIT) {
    return { allowed: false as const, hits };
  }
  return { allowed: true as const, hits };
}
