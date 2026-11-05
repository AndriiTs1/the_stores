import Link from "next/link";
import { Suspense } from "react";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { LanguageButtons, LanguageButtonsFallback } from "@/components/language-picker";
import type { Dict, DictKey } from "@/lib/i18n";

/** Information pages in the account menu, in groups (slugs of lib/store-pages). */
const GROUPS: { slug: string; title: DictKey }[][] = [
  [
    { slug: "versand", title: "shipping" },
    { slug: "rueckgabe", title: "pageReturns" },
  ],
  [
    { slug: "hilfe", title: "helpContact" },
    { slug: "ueber-uns", title: "pageAbout" },
  ],
  [
    { slug: "impressum", title: "pageImprint" },
    { slug: "datenschutz", title: "pagePrivacy" },
    { slug: "agb", title: "pageTerms" },
  ],
];

/**
 * What the account menu holds before customer accounts exist (no sign-in yet): the language, the order hint
 * and the store's information pages. Shown in the phone's side panel and as the /account page.
 */
export function AccountContent({
  locales,
  locale,
  base,
  d,
  heading: Heading,
  fallbackPath = "",
}: {
  locales: string[];
  locale: string;
  base: string;
  d: Dict;
  /** Section heading level: h2 on the page, h3 in the panel (whose title is the h2). */
  heading: "h2" | "h3";
  /** Path after the locale for the language links before hydration (e.g. "/account"). */
  fallbackPath?: string;
}) {
  return (
    <div className="divide-y divide-line">
      <section className="py-4">
        <Heading className="text-sm font-semibold uppercase tracking-wide text-meta">{d.language}</Heading>
        <div className="-ml-3 mt-1">
          <Suspense
            fallback={<LanguageButtonsFallback locales={locales} current={locale} base={base} path={fallbackPath} />}
          >
            <LanguageButtons locales={locales} current={locale} base={base} />
          </Suspense>
        </div>
      </section>
      <section className="py-4">
        <Heading className="text-base font-semibold">{d.myOrder}</Heading>
        <p className="mt-1 text-sm text-meta">{d.myOrderText}</p>
      </section>
      {GROUPS.map((group) => (
        <ul key={group[0].slug} className="py-2">
          {group.map((p) => (
            <li key={p.slug}>
              <Link
                href={`${base}/${locale}/info/${p.slug}`}
                className="flex min-h-12 items-center justify-between gap-3 rounded text-base font-semibold"
              >
                <span className="min-w-0 hyphens-auto break-words">{d[p.title]}</span>
                <CaretRight aria-hidden size={18} className="shrink-0 text-meta" />
              </Link>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
