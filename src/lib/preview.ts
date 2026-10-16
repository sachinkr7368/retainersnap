export function previewEnabled(): boolean {
  return process.env.ALLOW_PREVIEW === "1";
}
