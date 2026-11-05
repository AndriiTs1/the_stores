import { gridLabels } from "@/components/product-grid";
import { StableText } from "@/components/stable-text";
import { dictVariants, getDict } from "@/lib/i18n";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";
import { WishlistView } from "./wishlist-view";

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/wishlist">) {
  const { site, locale } = await params;
  return {
    title: getDict(locale).wishlist,
    robots: { index: false }, // every visitor's own list
    alternates: await languageAlternates(site, "/wishlist"),
  };
}

/** The phone's "Wishlist" tab: products saved with the heart, kept in this browser (no account needed). */
export default async function WishlistPage({ params }: PageProps<"/s/[site]/[locale]/wishlist">) {
  const { site, locale: rawLocale } = await params;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const d = getDict(locale);
  return (
    <>
      <h1 className="mb-6 text-2xl font-black tracking-tight sm:text-3xl">{d.wishlist}</h1>
      <WishlistView
        site={site}
        locale={locale}
        base={base}
        currency={store.currency}
        labels={{
          ...gridLabels(d, store.locales),
          empty: d.wishlistEmpty,
          emptyText: d.wishlistEmptyText,
          browse: <StableText text={d.ourSelection} variants={dictVariants("ourSelection", store.locales)} />,
        }}
      />
    </>
  );
}
