export function isWebhookAuthError(error: unknown): boolean {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    name.toLowerCase().includes("signature") ||
    message.includes("signature") ||
    message.includes("webhook-id") ||
    message.includes("webhook-signature") ||
    message.includes("webhook-timestamp")
  );
}
