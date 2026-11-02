import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductGrid } from "@/components/product-grid";
import { getProductCards, itemLimit, moreHref } from "@/lib/catalog";
import { db } from "@/lib/db";
import { getDict, tr } from "@/lib/i18n";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";

const loadCollection = cache(async (site: string, rawLocale: string, slug: string) => {
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const collection = await db.collection.findUnique({ where: { storeId_slug: { storeId: store.id, slug } } });
  if (!collection) notFound();
  return { store, locale, collection };
});

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/collections/[slug]">) {
  const { site, locale, slug } = await params;
  const { collection } = await loadCollection(site, locale, slug);
  return {
    title: tr(collection.name, locale),
    alternates: await languageAlternates(site, `/collections/${slug}`),
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: PageProps<"/s/[site]/[locale]/collections/[slug]">) {
  const { site, locale: rawLocale, slug } = await params;
  const { n } = await searchParams;
  const { store, locale, collection } = await loadCollection(site, rawLocale, slug);
  const base = await getBase();
  const d = getDict(locale);
  const limit = itemLimit(n);
  const { cards, hasMore } = await getProductCards(
    store.id,
    locale,
    { collections: { some: { id: collection.id } } },
    limit,
  );

  return (
    <>
      <h1 className="mb-6 text-2xl font-black tracking-tight sm:text-3xl">{tr(collection.name, locale)}</h1>
      {cards.length === 0 ? (
        <p className="text-muted">{d.noProducts}</p>
      ) : (
        <ProductGrid
          cards={cards}
          moreHref={hasMore ? moreHref(`${base}/${locale}/collections/${slug}`, limit) : null}
          base={base}
          locale={locale}
          currency={store.currency}
          labels={{ soldOut: d.soldOut, sizes: d.sizes, showMore: d.showMore }}
          preloadFirst
        />
      )}
    </>
  );
}
