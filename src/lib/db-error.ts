export function friendlyDbError(message: string, fallback: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("site limit")) {
    return "This plan has no room for another site. Upgrade to add more.";
  }
  if (lower.includes("seat limit")) {
    return "This plan has no open seats.";
  }
  if (lower.includes("duplicate") || lower.includes("unique")) {
    return "That is already saved in this workspace.";
  }
  if (lower.includes("invite email mismatch")) {
    return "Sign in with the email address the invite was sent to.";
  }
  if (lower.includes("invite expired")) return "This invite has expired. Ask for a new one.";
  if (lower.includes("invite already used")) return "This invite was already used.";
  if (lower.includes("invite not found")) return "This invite link is not valid.";
  if (lower.includes("client not in workspace")) return "That client is not in this workspace.";
  return fallback;
}
