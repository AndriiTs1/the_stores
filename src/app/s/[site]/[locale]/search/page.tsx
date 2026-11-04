import { ProductGrid } from "@/components/product-grid";
import { getProductCards, itemLimit, moreHref, searchProductIds, searchQuery } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/search">) {
  const { site, locale } = await params;
  return {
    title: getDict(locale).navSearch,
    robots: { index: false },
    alternates: await languageAlternates(site, "/search"),
  };
}

export default async function SearchPage({ params, searchParams }: PageProps<"/s/[site]/[locale]/search">) {
  const { site, locale: rawLocale } = await params;
  const { q: rawQ, n } = await searchParams;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const d = getDict(locale);
  const q = searchQuery(rawQ);
  const limit = itemLimit(n);

  if (!q) {
    return <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{d.searchHint}</h1>;
  }

  const ids = await searchProductIds(store.id, locale, q);
  const { cards, hasMore } = ids.length
    ? await getProductCards(store.id, locale, { id: { in: ids } }, limit)
    : { cards: [], hasMore: false };

  return (
    <>
      <h1 className="mb-6 break-words text-2xl font-black tracking-tight sm:text-3xl">
        {d.searchResults.replace("{q}", q)}
      </h1>
      {cards.length === 0 ? (
        <p className="text-muted">{d.searchEmpty}</p>
      ) : (
        <ProductGrid
          cards={cards}
          moreHref={hasMore ? moreHref(`${base}/${locale}/search`, limit, { q }) : null}
          base={base}
          locale={locale}
          currency={store.currency}
          labels={{ soldOut: d.soldOut, newBadge: d.newBadge, sizes: d.sizes, showMore: d.showMore }}
        />
      )}
    </>
  );
}
