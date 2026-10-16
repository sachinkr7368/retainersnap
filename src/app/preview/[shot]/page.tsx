import { notFound } from "next/navigation";
import { PreviewShot } from "@/components/preview/screens";
import { previewShots, type PreviewShotId } from "@/lib/fixtures/catalog";

export default async function PreviewShotPage({ params }: { params: Promise<{ shot: string }> }) {
  const { shot } = await params;
  const known = previewShots.find((item) => item.id === shot);
  if (!known) notFound();
  return (
    <div data-shot={known.id}>
      <PreviewShot id={known.id as PreviewShotId} />
    </div>
  );
}
