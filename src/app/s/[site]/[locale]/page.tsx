import Image from "next/image";
import Link from "next/link";
import { HomeBanner } from "@/components/home-banner";
import { StableText } from "@/components/stable-text";
import { gridLabels, ProductGrid } from "@/components/product-grid";
import { getProductCards, itemLimit, moreHref } from "@/lib/catalog";
import { db } from "@/lib/db";
import { dictVariants, getDict, tr } from "@/lib/i18n";
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
  const [{ cards, hasMore }, categories, brands] = await Promise.all([
    getProductCards(store.id, locale, {}, limit),
    db.category.findMany({ where: { storeId: store.id, ...withProducts }, orderBy: { position: "asc" } }),
    // Only brands with a logo: the row is a logo wall, shown from two logos on.
    db.brand.findMany({
      where: { storeId: store.id, logoUrl: { not: null }, ...withProducts },
      orderBy: { position: "asc" },
    }),
  ]);

  return (
    <>
      <h1 className="sr-only">{store.name}</h1>
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
        <section aria-labelledby="categories" className="mt-8 md:mt-12">
          <h2 id="categories" className="mb-4 text-xl font-bold sm:text-2xl">
            {d.categories}
          </h2>
          {/* One row that scrolls sideways (snapping, no scrollbar) and runs to the screen edges, 16px in on phones.
              Each pill as wide as its label in this language. */}
          <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-10 lg:scroll-px-10 lg:px-10">
            {categories.map((c) => (
              <li key={c.id} className="shrink-0 snap-start">
                <Link
                  href={`${base}/${locale}/categories/${c.slug}`}
                  className="inline-flex h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium ring-1 ring-inset ring-line hover:bg-surface"
                >
                  {tr(c.name, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {brands.length >= 2 && (
        <section aria-labelledby="brands" className="mt-8 md:mt-12">
          <h2 id="brands" className="mb-4 text-xl font-bold sm:text-2xl">
            {d.brands}
          </h2>
          {/* One row of logos: grey until hovered or focused. Phones scroll sideways; from md up to 6 in the row. */}
          <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:grid md:grid-cols-6 md:overflow-visible md:px-0">
            {brands.map((b) => (
              <li key={b.id} className="w-36 shrink-0 snap-start md:w-auto">
                <Link
                  href={`${base}/${locale}/brands/${b.slug}`}
                  className="group flex h-20 items-center justify-center rounded-lg border border-divider bg-background px-4"
                >
                  <span className="relative h-10 w-full">
                    <Image
                      src={b.logoUrl!}
                      alt={b.name}
                      fill
                      sizes="160px"
                      className="object-contain grayscale transition-[filter] duration-200 group-hover:grayscale-0 group-focus-visible:grayscale-0 motion-reduce:transition-none"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
