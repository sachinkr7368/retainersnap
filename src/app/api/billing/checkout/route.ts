import { annualConfigured, missingCoreEnv, readEnv } from "@/lib/env";
import { apiError, apiOk } from "@/lib/http";
import { publicMessage } from "@/lib/api-result";
import { getPaymentProvider } from "@/lib/payments";
import { getMember } from "@/lib/session";
import { checkoutSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (missingCoreEnv().length > 0) {
    return apiError("not_configured", "Supabase is not configured.", 503);
  }
  const member = await getMember();
  if (!member) return apiError("unauthenticated", "Sign in to subscribe.", 401);
  if (member.role !== "owner") {
    return apiError("forbidden", "Only the workspace owner can subscribe.", 403);
  }
  if (!member.user.email) {
    return apiError("missing_email", "This account has no email address.", 400);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("invalid_json", "Send plan and interval as JSON.", 400);
  }
  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) return apiError("invalid_body", "Choose a plan and a billing interval.", 400);

  const env = readEnv();
  if (parsed.data.interval === "year" && !annualConfigured(env)) {
    return apiError("yearly_unconfigured", "Yearly prices are not configured. Add the yearly product ids, or choose monthly.", 400);
  }

  try {
    const provider = getPaymentProvider();
    const session = await provider.createCheckout({
      workspaceId: member.workspace.id,
      plan: parsed.data.plan,
      interval: parsed.data.interval,
      email: member.user.email,
      name: member.workspace.name,
    });
    return apiOk({ url: session.url });
  } catch (error) {
    return apiError("checkout_failed", publicMessage(error, "Checkout could not start."), 400);
  }
}
