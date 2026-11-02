import { CollectionBanner } from "@/components/collection-banner";
import { ProductGrid } from "@/components/product-grid";
import { getProductCards, itemLimit, moreHref } from "@/lib/catalog";
import { db } from "@/lib/db";
import { getDict, tr } from "@/lib/i18n";
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
  const [{ cards, hasMore }, featured] = await Promise.all([
    getProductCards(store.id, locale, {}, limit),
    db.collection.findFirst({ where: { storeId: store.id, featured: true }, orderBy: { position: "asc" } }),
  ]);

  return (
    <>
      <h1 className="sr-only">{store.name}</h1>
      {featured && (
        <CollectionBanner
          eyebrow={tr(featured.name, locale)}
          headline={tr(featured.headline, locale) || tr(featured.name, locale)}
          href={`${base}/${locale}/collections/${featured.slug}`}
          cta={d.discover}
        />
      )}
      <section aria-labelledby="new-arrivals">
        <h2 id="new-arrivals" className="mb-4 text-xl font-bold sm:text-2xl">
          {d.newArrivals}
        </h2>
        {cards.length === 0 ? (
          <p className="text-muted">{d.noProducts}</p>
        ) : (
          <ProductGrid
            cards={cards}
            moreHref={hasMore ? moreHref(`${base}/${locale}`, limit) : null}
            base={base}
            locale={locale}
            currency={store.currency}
            labels={{ soldOut: d.soldOut, sizes: d.sizes, showMore: d.showMore }}
            preloadFirst
          />
        )}
      </section>
    </>
  );
}
