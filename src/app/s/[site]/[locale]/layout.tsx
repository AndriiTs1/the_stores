import type { Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import "../../../globals.css";
import { fontVariables } from "../../../fonts";
import { CartButton, CartCountProvider } from "@/components/cart-count";
import { StorefrontBottomBar } from "@/components/storefront-bottom-bar";
import { LanguageButtons, LanguageButtonsFallback } from "@/components/language-picker";
import { SearchForm } from "@/components/search-form";
import { StoreNav } from "@/components/store-nav";
import { getCartCount } from "@/lib/cart";
import { db } from "@/lib/db";
import { getDict, tr } from "@/lib/i18n";
import { STORE_PAGES } from "@/lib/store-pages";
import { getBase, getStore, getStoreAndLocale, requestOrigin } from "@/lib/tenant";

export async function generateMetadata({ params }: LayoutProps<"/s/[site]/[locale]">) {
  const { site } = await params;
  const store = await getStore(site);
  return {
    metadataBase: await requestOrigin(),
    title: { default: store.name, template: `%s · ${store.name}` },
  };
}

/** A link from the store settings: a full URL as is, else a path after the locale ("/" = the catalogue). */
function storeHref(href: string | null, base: string, locale: string): string | null {
  if (!href) return null;
  if (/^https?:\/\//.test(href)) return href;
  return `${base}/${locale}${href === "/" ? "" : href}`;
}

// Content may extend under the iPhone home indicator; the bottom bar pads itself with safe-area-inset-bottom.
export const viewport: Viewport = { viewportFit: "cover" };

// Root layout of the storefront: <html lang> is the page language.
export default async function StorefrontLayout({ children, params }: LayoutProps<"/s/[site]/[locale]">) {
  const { site, locale: rawLocale } = await params;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const d = getDict(locale);
  const [count, collections] = await Promise.all([
    getCartCount(store.id),
    db.collection.findMany({ where: { storeId: store.id, inNav: true }, orderBy: { position: "asc" } }),
  ]);
  const announcement = tr(store.announcement, locale);
  const announcementHref = storeHref(store.announcementHref, base, locale);
  const nav = collections.map((c) => ({ href: `${base}/${locale}/collections/${c.slug}`, label: tr(c.name, locale) }));

  return (
    <html
      lang={locale}
      className={`${fontVariables} h-full antialiased`}
      // Browser translators (e.g. Google Translate) rewrite lang/class on <html>; only this element's attributes.
      suppressHydrationWarning
    >
      {/* Phones: room for the bottom bar (56px + safe area) so nothing hides under it. */}
      <body className="flex min-h-full flex-col pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
        <CartCountProvider count={count}>
          {/* Scrolls away with the page; only the header below sticks. */}
          {/* The store's message (settings); none → no bar. */}
          {announcement && (
            // White keyboard focus here: the grey outline would be too faint on black.
            <div className="bg-foreground px-4 py-2 text-center text-xs font-medium tracking-wide text-background [--ring:#fff]">
              {announcementHref ? (
                <Link href={announcementHref} className="rounded underline-offset-2 hover:underline">
                  {announcement}
                </Link>
              ) : (
                announcement
              )}
            </div>
          )}
          {/* Phone: logo and cart, the search on a second row (navigation is the bottom bar). From md the navigation
              and languages join the first row; from lg the search too. The 1px bottom line is an inset shadow. */}
          <header className="sticky top-0 z-40 bg-background shadow-[inset_0_-1px_0_var(--line)]">
            <div className="container-page flex flex-wrap items-center gap-x-3 gap-y-2 py-2 lg:h-[72px] lg:flex-nowrap lg:gap-x-6 lg:py-0">
              {/* Never truncated: shrinks by breakpoint and wraps to at most two lines on small phones. */}
              <Link
                href={`${base}/${locale}`}
                className="min-w-0 flex-1 break-words rounded font-display text-base font-bold uppercase leading-tight tracking-tight sm:text-lg md:flex-none lg:text-xl"
              >
                {store.name}
              </Link>
              <StoreNav
                items={nav}
                label={d.mainNav}
                className="hidden shrink-0 gap-4 md:flex lg:gap-5"
                linkClassName="rounded text-sm font-semibold hover:text-accent aria-[current=page]:text-accent"
              />
              <SearchForm
                action={`${base}/${locale}/search`}
                labels={{ placeholder: d.searchPlaceholder, submit: d.navSearch }}
                className="order-last w-full lg:order-none lg:ml-auto lg:w-auto lg:max-w-sm lg:flex-1"
              />
              <div className="flex shrink-0 items-center gap-2 md:ml-auto lg:ml-0">
                {/* From md the languages sit here; on phones they are on the account screen. */}
                <div className="hidden md:block">
                  <Suspense fallback={<LanguageButtonsFallback locales={store.locales} current={locale} base={base} />}>
                    <LanguageButtons locales={store.locales} current={locale} base={base} />
                  </Suspense>
                </div>
                <CartButton
                  href={`${base}/${locale}/cart`}
                  locale={locale}
                  labels={{ one: d.cartLabelOne, other: d.cartLabelOther }}
                />
              </div>
            </div>
          </header>

          <main className="container-page flex-1 py-6 sm:py-8">{children}</main>

          <footer className="mt-10 border-t border-line">
            <div className="container-page grid gap-8 py-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {(["service", "legal"] as const).map((group) => (
                <nav key={group} aria-label={group === "service" ? d.footerService : d.footerLegal}>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    {group === "service" ? d.footerService : d.footerLegal}
                  </h2>
                  <ul className="space-y-2">
                    {STORE_PAGES.filter((p) => p.group === group).map((p) => (
                      <li key={p.slug}>
                        <Link href={`${base}/${locale}/info/${p.slug}`} className="hover:text-accent">
                          {d[p.title]}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
            <div className="container-page flex flex-wrap justify-between gap-2 border-t border-line py-6 text-xs text-muted">
              <span>
                © {new Date().getFullYear()} <span className="uppercase">{store.name}</span>
              </span>
              <span>
                {store.currency} · {d.vatIncluded} ({(store.vatRateBp / 100).toFixed(1)}%)
                {store.contactEmail && <> · {store.contactEmail}</>}
              </span>
            </div>
          </footer>

          <StorefrontBottomBar
            base={base}
            locale={locale}
            locales={store.locales}
            labels={{
              home: d.navHome,
              search: d.navSearch,
              language: d.language,
              languageButton: d.languageButton,
            }}
          />
        </CartCountProvider>
      </body>
    </html>
  );
}
