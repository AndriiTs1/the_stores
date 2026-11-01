import type { Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import "../../../globals.css";
import { fontVariables } from "../../../fonts";
import { CartButton, CartCountProvider } from "@/components/cart-count";
import { StorefrontBottomBar } from "@/components/storefront-bottom-bar";
import { LanguageButtons, LanguageButtonsFallback } from "@/components/language-picker";
import { getCartCount } from "@/lib/cart";
import { getDict } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { getBase, getStore, getStoreAndLocale, requestOrigin } from "@/lib/tenant";

export async function generateMetadata({ params }: LayoutProps<"/s/[site]/[locale]">) {
  const { site } = await params;
  const store = await getStore(site);
  return {
    metadataBase: await requestOrigin(),
    title: { default: store.name, template: `%s · ${store.name}` },
  };
}

// Content may extend under the iPhone home indicator; the bottom bar pads itself with safe-area-inset-bottom.
export const viewport: Viewport = { viewportFit: "cover" };

// Root layout of the storefront: <html lang> is the page language.
export default async function StorefrontLayout({ children, params }: LayoutProps<"/s/[site]/[locale]">) {
  const { site, locale: rawLocale } = await params;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const d = getDict(locale);
  const count = await getCartCount(store.id);

  return (
    <html
      lang={locale}
      className={`${fontVariables} h-full antialiased`}
      // Browser translators (e.g. Google Translate) rewrite lang/class on <html>; only this element's attributes.
      suppressHydrationWarning
    >
      {/* Phones: room for the floating dock (12 + 56 + 12px + safe area) so nothing hides under it. */}
      <body className="flex min-h-full flex-col pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0">
        <CartCountProvider count={count}>
          {/* Scrolls away with the page; only the header below sticks. */}
          {store.freeShippingFrom != null && (
            <div className="bg-foreground px-4 py-2 text-center text-xs font-medium tracking-wide text-background tabular-nums">
              {d.freeShippingFrom} {formatMoney(store.freeShippingFrom, locale, store.currency)}
            </div>
          )}
          {/* Fixed height (56px phone, 72px from md). The 1px bottom line is an inset shadow, not a border,
              so buttons centre on whole pixels and the language capsule sits exactly 8px below. */}
          <header className="sticky top-0 z-40 h-14 bg-background shadow-[inset_0_-1px_0_var(--line)] md:h-[72px]">
            <div className="container-page flex h-full items-center justify-between gap-3">
              {/* Never truncated: shrinks by breakpoint and wraps to at most two lines on small phones. */}
              <Link
                href={`${base}/${locale}`}
                className="min-w-0 break-words rounded font-display text-base font-bold uppercase leading-tight tracking-tight sm:text-lg lg:text-xl"
              >
                {store.name}
              </Link>
              <nav className="flex shrink-0 items-center gap-2">
                {/* From md the languages sit here; on phones they live in the bottom bar. */}
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
              </nav>
            </div>
          </header>

          <main className="container-page flex-1 py-6 sm:py-8">{children}</main>

          {/* Phones: no footer — the bottom bar is the page end there. VAT stays visible next to prices. */}
          <footer className="hidden border-t border-line md:block">
            <div className="container-page flex flex-wrap justify-between gap-2 py-6 text-xs text-muted">
              <span>
                © {new Date().getFullYear()} {store.name}
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
              favorites: d.navFavorites,
              account: d.navAccount,
              comingSoon: d.comingSoon,
              languageButton: d.languageButton,
            }}
          />
        </CartCountProvider>
      </body>
    </html>
  );
}
