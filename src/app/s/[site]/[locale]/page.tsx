import { ProductGrid } from "@/components/product-grid";
import { getProductCards, itemLimit, PAGE_SIZE } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]">) {
  const { site } = await params;
  return { alternates: await languageAlternates(site, "") };
}

export default async function StoreHome({ params, searchParams }: PageProps<"/s/[site]/[locale]">) {
  const { site, locale: rawLocale } = await params;
  const { n } = await searchParams;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const d = getDict(locale);
  const limit = itemLimit(n);
  const { cards, hasMore } = await getProductCards(store.id, locale, {}, limit);

  return (
    <section aria-labelledby="new-arrivals">
      <h2 id="new-arrivals" className="mb-4 text-xl font-bold sm:text-2xl">
        {d.newArrivals}
      </h2>
      {cards.length === 0 ? (
        <p className="text-muted">{d.noProducts}</p>
      ) : (
        <ProductGrid
          cards={cards}
          moreHref={hasMore ? `${base}/${locale}?n=${limit + PAGE_SIZE}` : null}
          base={base}
          locale={locale}
          currency={store.currency}
          labels={{ soldOut: d.soldOut, sizes: d.sizes, showMore: d.showMore }}
          preloadFirst
        />
      )}
    </section>
  );
}
