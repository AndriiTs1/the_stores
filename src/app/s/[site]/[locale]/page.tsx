import Image from "next/image";
import Link from "next/link";
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
  // Categories and brands are listed only when they have something to show.
  const withProducts = { products: { some: { status: "ACTIVE" as const } } };
  const [{ cards, hasMore }, featured, categories, brands] = await Promise.all([
    getProductCards(store.id, locale, {}, limit),
    db.collection.findFirst({ where: { storeId: store.id, featured: true }, orderBy: { position: "asc" } }),
    db.category.findMany({ where: { storeId: store.id, ...withProducts }, orderBy: { position: "asc" } }),
    db.brand.findMany({ where: { storeId: store.id, ...withProducts }, orderBy: { position: "asc" } }),
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

      {categories.length > 0 && (
        <section aria-labelledby="categories" className="mt-14">
          <h2 id="categories" className="mb-4 text-xl font-bold sm:text-2xl">
            {d.categories}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`${base}/${locale}/categories/${c.slug}`}
                  className="inline-flex rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset ring-line hover:bg-surface"
                >
                  {tr(c.name, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {brands.length > 0 && (
        <section aria-labelledby="brands" className="mt-14">
          <h2 id="brands" className="mb-4 text-xl font-bold sm:text-2xl">
            {d.brands}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {brands.map((b) => (
              <li key={b.id}>
                {/* Logo when the store has one, else the name. */}
                <Link
                  href={`${base}/${locale}/brands/${b.slug}`}
                  className="flex h-20 items-center justify-center rounded-lg bg-surface px-3 text-center font-display text-sm font-bold uppercase tracking-tight hover:ring-1 hover:ring-line"
                >
                  {b.logoUrl ? (
                    <span className="relative h-10 w-full">
                      <Image src={b.logoUrl} alt={b.name} fill sizes="160px" className="object-contain" />
                    </span>
                  ) : (
                    b.name
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
