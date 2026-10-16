import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { previewEnabled } from "@/lib/preview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  if (!previewEnabled()) notFound();
  return children;
}
