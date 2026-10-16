import Link from "next/link";
import { previewShots } from "@/lib/fixtures/catalog";

export default function PreviewIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16" data-shot="index">
      <h1 className="font-serif text-4xl">Preview gallery</h1>
      <p className="mt-2 text-sm text-muted">
        Every product screen rendered with mock data. Production builds leave this route off.
      </p>
      <ul className="mt-8 grid gap-2">
        {previewShots.map((shot) => (
          <li key={shot.id}>
            <Link href={`/preview/${shot.id}`} className="block rounded-2xl border border-line bg-card px-4 py-3">
              {shot.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
