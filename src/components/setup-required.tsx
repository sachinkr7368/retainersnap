export function SetupRequired({ missing }: { missing: string[] }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <p className="text-xs font-medium tracking-[0.18em] text-moss uppercase">RetainerSnap</p>
      <h1 className="mt-3 font-serif text-4xl">Add the Supabase keys to start</h1>
      <p className="mt-4 text-muted">
        The marketing site works without them. Sign-in, checks, and reports need a Supabase project. Copy{" "}
        <code className="text-ink">.env.example</code> to <code className="text-ink">.env.local</code> and fill these
        in. The clicks are in <code className="text-ink">docs/SETUP.md</code>.
      </p>
      <ul className="mt-6 grid gap-2">
        {missing.map((name) => (
          <li key={name} className="rounded-lg border border-line bg-card px-3 py-2 font-mono text-sm">
            {name}
          </li>
        ))}
      </ul>
    </main>
  );
}
