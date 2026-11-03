import Link from "next/link";

/** Home page banner for the store's featured collection: a headline and one button, at most 40% of the screen. */
export function CollectionBanner({
  eyebrow,
  headline,
  href,
  cta,
}: {
  eyebrow: string;
  headline: string;
  href: string;
  cta: string;
}) {
  return (
    <section
      aria-labelledby="collection-banner"
      className="mb-8 flex max-h-[40vh] min-h-40 flex-col items-start justify-center gap-3 overflow-hidden rounded-xl bg-foreground px-5 py-6 text-background sm:mb-10 sm:gap-4 sm:px-10 sm:py-10"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-background/60">{eyebrow}</p>
      <h2
        id="collection-banner"
        className="max-w-2xl hyphens-auto break-words text-2xl font-bold leading-tight sm:text-4xl"
      >
        {headline}
      </h2>
      <Link href={href} className="btn btn-light">
        {cta}
      </Link>
    </section>
  );
}
