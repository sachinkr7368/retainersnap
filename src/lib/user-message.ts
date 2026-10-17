const SECRET = /sk_live|sk_test|whsec_|service_role|eyJ[a-zA-Z0-9_-]{10,}|postgres:\/\//i;

const TECHNICAL =
  /next_public_|supabase_|pagespeed_|stripe_|dodo_|cron_secret|resend_|price_|prod_|cus_|econn|enotfound|getaddrinfo|fetch failed|typeerror|node:|webpack|\bsql\b|trigger|webhook|\bstack\b|status code|returned \d|api key|not configured|is not set|socket|aborted|timed out|\btimeout\b/i;

function looksTechnical(message: string): boolean {
  if (message.length > 220 || message.includes("\n")) return true;
  if (SECRET.test(message) || TECHNICAL.test(message)) return true;
  return /[A-Z][A-Z0-9_]{3,}/.test(message);
}

function textOf(input: unknown): string {
  if (typeof input === "string") return input.trim();
  if (input instanceof Error) return input.message.trim();
  return "";
}

function knownMessage(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "That email and password do not match.";
  }
  if (lower.includes("email not confirmed")) return "Confirm the email we sent, then sign in.";
  if (
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("user already exists")
  ) {
    return "An account with that email already exists. Sign in instead.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (lower.includes("unable to validate email") || lower.includes("invalid format")) {
    return "That email address does not look right.";
  }
  if (lower.includes("signups not allowed") || lower.includes("signup is disabled")) {
    return "New accounts are paused right now.";
  }
  if (lower.includes("provider is not enabled") || lower.includes("unsupported provider")) {
    return "Google sign-in is not available yet. Use email and password.";
  }
  if (lower.includes("next_public_supabase") || lower.includes("anon_key") || lower.includes("auth is not configured")) {
    return "Sign-in is not available yet.";
  }
  if (lower.includes("pagespeed_api") || lower.includes("service role") || lower.includes("service_role")) {
    return "This check is not available right now.";
  }
  if (lower.includes("stripe_secret") || lower.includes("dodo_payments")) {
    return "Checkout is not available right now.";
  }
  return null;
}

export function userMessage(input: unknown, fallback: string): string {
  const message = textOf(input);
  if (!message) return fallback;
  const known = knownMessage(message);
  if (known) return known;
  if (looksTechnical(message)) return fallback;
  return message;
}
