import Image from "next/image";
import Link from "next/link";
import { CategoryTiles, type Tile } from "@/components/category-tiles";
import { HomeBanner } from "@/components/home-banner";
import { StableText } from "@/components/stable-text";
import { gridLabels, ProductGrid } from "@/components/product-grid";
import { getProductCards, hasSale, itemLimit, moreHref } from "@/lib/catalog";
import { db } from "@/lib/db";
import { dictVariants, getDict, tr, trVariants } from "@/lib/i18n";
import { imageSrc } from "@/lib/og";
import { storeHref } from "@/lib/store-link";
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
  const bannerTitle = store.bannerEnabled ? tr(store.bannerTitle, locale) : "";
  const [{ cards, hasMore }, categories, brands, collections, sale] = await Promise.all([
    getProductCards(store.id, locale, {}, limit),
    db.category.findMany({ where: { storeId: store.id, ...withProducts }, orderBy: { position: "asc" } }),
    db.brand.findMany({ where: { storeId: store.id, ...withProducts }, orderBy: { position: "asc" } }),
    // The tiles: the store's menu categories, in their order, each with a picture of one of its newest products.
    db.collection.findMany({
      where: { storeId: store.id, inNav: true },
      orderBy: { position: "asc" },
      include: {
        products: {
          where: { status: "ACTIVE", images: { isEmpty: false } },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: { images: true },
          take: 6,
        },
      },
    }),
    hasSale(store.id),
  ]);
  // Each tile shows a product the tiles before it don't (a product is often in several categories).
  const used = new Set<string>();
  const pictures = collections.map((c) => {
    const picture = c.products.map((p) => p.images[0]).find((src) => !used.has(src)) ?? c.products[0]?.images[0];
    if (picture) used.add(picture);
    return picture;
  });
  const tiles: Tile[] = await Promise.all(
    collections.map(async (c, i) => ({
      href: `${base}/${locale}/collections/${c.slug}`,
      label: tr(c.name, locale),
      color: c.tileColor,
      image: c.tileImageUrl,
      silhouette: c.tileImageUrl ? null : await imageSrc(pictures[i], {}),
    })),
  );

  return (
    <>
      <h1 className="sr-only">{store.name}</h1>
      <CategoryTiles
        tiles={tiles}
        sale={sale ? { href: `${base}/${locale}/sale`, label: d.sale } : null}
        label={d.shopCategories}
      />
      {/* Off unless switched on in the store settings. */}
      {bannerTitle && (
        <HomeBanner
          eyebrow={tr(store.bannerEyebrow, locale)}
          title={bannerTitle}
          text={tr(store.bannerText, locale)}
          image={store.bannerImageUrl}
          // Its own link from the settings, else the product grid below.
          href={storeHref(tr(store.bannerHref, locale), base, locale) ?? "#selection"}
          cta={<StableText text={d.discover} variants={dictVariants("discover", store.locales)} />}
        />
      )}
      {/* scroll-mt: the sticky header (two rows on phones) must not cover the heading after the jump. */}
      <section id="selection" aria-labelledby="selection-title" className="scroll-mt-32 md:scroll-mt-24">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="selection-title" className="min-w-0 text-xl font-bold sm:text-2xl">
            {d.ourSelection}
          </h2>
          <Link
            href={`${base}/${locale}/products`}
            className="shrink-0 rounded text-sm font-semibold underline-offset-4 hover:text-accent hover:underline"
          >
            <span className="md:hidden">{d.viewAllShort}</span>
            <span className="hidden md:inline">{d.viewAll}</span>
          </Link>
        </div>
        {cards.length === 0 ? (
          <p className="text-muted">{d.noProducts}</p>
        ) : (
          <ProductGrid
            cards={cards}
            moreHref={hasMore ? moreHref(`${base}/${locale}`, limit) : null}
            base={base}
            locale={locale}
            currency={store.currency}
            labels={gridLabels(d, store.locales)}
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
                  <StableText text={tr(c.name, locale)} variants={trVariants(c.name, store.locales)} />
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
