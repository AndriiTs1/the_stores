import { notFound } from "next/navigation";
import { getDict } from "@/lib/i18n";
import { findStorePage } from "@/lib/store-pages";
import { getStoreAndLocale, languageAlternates } from "@/lib/tenant";

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/info/[slug]">) {
  const { site, locale, slug } = await params;
  const page = findStorePage(slug);
  if (!page) notFound();
  return {
    title: getDict(locale)[page.title],
    robots: { index: false }, // draft: kept out of search engines until the store writes the text
    alternates: await languageAlternates(site, `/info/${slug}`),
  };
}

/** Footer pages (help, shipping, returns, about, legal). No store has its texts yet: each is a marked draft. */
export default async function InfoPage({ params }: PageProps<"/s/[site]/[locale]/info/[slug]">) {
  const { site, locale: rawLocale, slug } = await params;
  const { locale } = await getStoreAndLocale(site, rawLocale);
  const page = findStorePage(slug);
  if (!page) notFound();
  const d = getDict(locale);

  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-8">
      <p className="inline-block rounded bg-accent/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
        {d.draft}
      </p>
      <h1 className="mt-3 hyphens-auto break-words text-2xl font-black tracking-tight sm:text-3xl">{d[page.title]}</h1>
      <p className="mt-4 text-muted">{d.draftText}</p>
    </div>
  );
}
