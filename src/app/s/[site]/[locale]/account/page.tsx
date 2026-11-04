import Link from "next/link";
import { Suspense } from "react";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { LanguageButtons, LanguageButtonsFallback } from "@/components/language-picker";
import { getDict, type DictKey } from "@/lib/i18n";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/account">) {
  const { site, locale } = await params;
  return { title: getDict(locale).account, alternates: await languageAlternates(site, "/account") };
}

/** Information pages listed on the account screen (slugs of lib/store-pages). */
const LINKS: { slug: string; title: DictKey }[] = [
  { slug: "hilfe", title: "helpContact" },
  { slug: "versand", title: "shippingReturns" },
  { slug: "impressum", title: "pageImprint" },
  { slug: "datenschutz", title: "pagePrivacy" },
  { slug: "agb", title: "pageTerms" },
];

const section = "py-4";
const heading = "text-base font-semibold";

/**
 * The phone's "Account" tab, before customer accounts exist: no sign-in yet (its place is the top of this
 * screen), the order hint, the language choice (on phones only here) and the store's information pages.
 * A language change keeps this screen (LanguageButtons only swaps the locale segment).
 */
export default async function AccountPage({ params }: PageProps<"/s/[site]/[locale]/account">) {
  const { site, locale: rawLocale } = await params;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const d = getDict(locale);

  return (
    <>
      <h1 className="mb-4 text-2xl font-black tracking-tight sm:text-3xl">{d.account}</h1>
      {/* Sign-in goes here once customer accounts are built. */}
      <ul className="divide-y divide-line border-y border-line">
        <li className={section}>
          <h2 className={heading}>{d.myOrder}</h2>
          <p className="mt-1 text-sm text-meta">{d.myOrderText}</p>
        </li>
        <li className={section}>
          <h2 className={heading}>{d.language}</h2>
          <div className="-ml-3 mt-1">
            <Suspense fallback={<LanguageButtonsFallback locales={store.locales} current={locale} base={base} path="/account" />}>
              <LanguageButtons locales={store.locales} current={locale} base={base} />
            </Suspense>
          </div>
        </li>
        {LINKS.map((l) => (
          <li key={l.slug}>
            <Link
              href={`${base}/${locale}/info/${l.slug}`}
              className="flex min-h-14 items-center justify-between gap-3 py-3 text-base font-semibold"
            >
              <span className="min-w-0 hyphens-auto break-words">{d[l.title]}</span>
              <CaretRight aria-hidden size={18} className="shrink-0 text-meta" />
            </Link>
          </li>
        ))}
      </ul>
      {store.contactEmail && (
        <p className="mt-4 text-sm text-meta">
          <a href={`mailto:${store.contactEmail}`} className="rounded underline underline-offset-2">
            {store.contactEmail}
          </a>
        </p>
      )}
    </>
  );
}
