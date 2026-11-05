/** Placeholder for a legal page until the real text exists: no operator data is made up here. */
export function LegalDraft({ title, text, draft }: { title: string; text: string; draft: string }) {
  return (
    <main className="container-page flex-1 py-12 sm:py-16">
      <p className="inline-block rounded bg-accent/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
        {draft}
      </p>
      <h1 className="mt-3 hyphens-auto break-words font-display text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-4 max-w-xl text-muted">{text}</p>
    </main>
  );
}
