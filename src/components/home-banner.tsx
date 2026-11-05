import Image from "next/image";
import Link from "next/link";

/**
 * Home page banner from the store settings (shown only when switched on there): a small line, a title, one line of
 * text and one button, and the banner picture on the right when there is one; at most 40% of the screen.
 */
export function HomeBanner({
  eyebrow,
  title,
  text,
  image,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  text: string;
  image?: string | null;
  href: string;
  cta: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby="home-banner"
      className="relative mb-8 flex max-h-[40vh] min-h-40 overflow-hidden rounded-xl bg-banner text-foreground sm:mb-10"
    >
      <div className="relative z-10 flex flex-col items-start justify-center gap-2 px-5 py-6 sm:gap-3 sm:px-10 sm:py-10">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>}
        {/* hyphens-auto: long compounds (German) break by syllable on phones instead of overflowing. */}
        <h2 id="home-banner" className="max-w-2xl hyphens-auto break-words text-2xl font-bold leading-tight sm:text-4xl">
          {title}
        </h2>
        {text && <p className="max-w-xl hyphens-auto break-words text-sm text-banner-text sm:text-base">{text}</p>}
        <Link href={href} className="btn btn-accent mt-1 sm:mt-2">
          {cta}
        </Link>
      </div>
      {image && (
        <div className="relative ml-auto hidden w-2/5 shrink-0 sm:block">
          <Image src={image} alt="" fill sizes="40vw" className="object-cover" />
        </div>
      )}
    </section>
  );
}
