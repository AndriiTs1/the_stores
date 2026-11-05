import Image from "next/image";
import Link from "next/link";
import { HomeBanner } from "@/components/home-banner";
import { gridLabels, ProductGrid } from "@/components/product-grid";
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
  const bannerTitle = tr(store.bannerTitle, locale);
  const [{ cards, hasMore }, categories, brands] = await Promise.all([
    getProductCards(store.id, locale, {}, limit),
    db.category.findMany({ where: { storeId: store.id, ...withProducts }, orderBy: { position: "asc" } }),
    db.brand.findMany({ where: { storeId: store.id, ...withProducts }, orderBy: { position: "asc" } }),
  ]);

  return (
    <>
      <h1 className="sr-only">{store.name}</h1>
      {bannerTitle && (
        <HomeBanner
          eyebrow={tr(store.bannerEyebrow, locale)}
          title={bannerTitle}
          text={tr(store.bannerText, locale)}
          // The catalogue is this page: the button jumps to the product grid below.
          href="#selection"
          cta={d.discover}
        />
      )}
      {/* scroll-mt: the sticky header (two rows on phones) must not cover the heading after the jump. */}
      <section id="selection" aria-labelledby="selection-title" className="scroll-mt-32 md:scroll-mt-24">
        <h2 id="selection-title" className="mb-4 text-xl font-bold sm:text-2xl">
          {d.ourSelection}
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
            labels={gridLabels(d)}
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
