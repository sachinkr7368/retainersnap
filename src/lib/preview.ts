export function previewEnabled(): boolean {
  return process.env.ALLOW_PREVIEW === "1";
}

export function isPreviewPath(pathname: string): boolean {
  return pathname === "/preview" || pathname.startsWith("/preview/");
}
