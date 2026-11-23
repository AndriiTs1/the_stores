import Image from "next/image";
import Link from "next/link";
import { HomeBanner } from "@/components/home-banner";
import { LineSwitcher } from "@/components/line-switcher";
import { Suspense } from "react";
import { StableText } from "@/components/stable-text";
import { gridLabels, ProductGrid } from "@/components/product-grid";
import { getProductCards, itemLimit, moreHref } from "@/lib/catalog";
import { db } from "@/lib/db";
import { dictVariants, getDict, tr } from "@/lib/i18n";
import { parseLine, resolveLine, withLine } from "@/lib/lines";
import { storeLines } from "@/lib/store-lines";
import { storeHref } from "@/lib/store-link";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]">) {
  const { site } = await params;
  return { alternates: await languageAlternates(site, "") };
}

export default async function StoreHome({ params, searchParams }: PageProps<"/s/[site]/[locale]">) {
  const { site, locale: rawLocale } = await params;
  const { n, line: lineParam } = await searchParams;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const d = getDict(locale);
  const limit = itemLimit(n);
  // The part of the store shown (Outlet by default, else the first with products); its links keep the asked one.
  const asked = parseLine(lineParam);
  const line = resolveLine(asked, await storeLines(store.id));
  const inLine = line ? { line } : {};
  // Brands are listed only when they have something to show.
  const withProducts = { products: { some: { status: "ACTIVE" as const } } };
  const bannerTitle = store.bannerEnabled ? tr(store.bannerTitle, locale) : "";
  const [{ cards, hasMore }, brands] = await Promise.all([
    getProductCards(store.id, locale, inLine, limit),
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
      {/* THE STORES experience — compact mobile layout. */}
      <div className="mb-6 md:hidden">
        <div className="mb-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
            {d.heroEyebrow}
          </p>
          <p className="whitespace-pre-line font-display text-[25px] font-bold leading-[1.08] tracking-tight text-neutral-950">
            {d.heroTitle}
          </p>
          <p className="mt-2 max-w-[350px] text-[13px] leading-5 text-neutral-600">
            {d.heroDescription}
          </p>
        </div>

        <div className="mb-2">
          <Suspense>
            <LineSwitcher
              tabs={(await storeLines(store.id)).map((id) => ({
                id,
                label: {
                  NEW: d.lineNew,
                  OUTLET: d.lineOutlet,
                  PRELOVED: d.lineSecondStory,
                }[id],
              }))}
              home={`${base}/${locale}`}
              label={d.lines}
              afterBanner
            />
          </Suspense>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#e8d5cb]">
          <Image
            src="/images/hero/virtual-styling-mobile.png"
            alt="Digital fashion mannequin wearing a black jacket, cream sweater, jeans and sneakers"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover object-center"
          />
        </div>
      </div>

      {/* THE STORES experience — desktop layout unchanged. */}
      <div className="relative mb-8 hidden aspect-[2/1] w-full overflow-hidden rounded-lg bg-[#e8d5cb] md:mb-12 md:block lg:aspect-[11/5]">
        <Image
          src="/images/hero/virtual-styling.png"
          alt="Digital fashion mannequin wearing a black jacket, cream sweater, jeans and sneakers"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
          className="object-cover object-[center_40%]"
        />
        <div className="absolute inset-0 hidden items-center md:flex">
          <div className="w-[42%] pl-8 lg:pl-12">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-700">
              {d.heroEyebrow}
            </p>
            <p className="whitespace-pre-line font-display text-4xl font-bold leading-[1.08] tracking-tight text-neutral-950 lg:text-[44px] xl:text-[52px]">
              {d.heroTitle}
            </p>
            <p className="mt-5 max-w-[350px] text-sm leading-6 text-neutral-700 lg:text-base">
              {d.heroDescription}
            </p>

            <div className="mt-6 hidden xl:block">
              <Suspense>
                <LineSwitcher
                  tabs={(await storeLines(store.id)).map((id) => ({
                    id,
                    label: {
                      NEW: d.lineNew,
                      OUTLET: d.lineOutlet,
                      PRELOVED: d.lineSecondStory,
                    }[id],
                  }))}
                  home={`${base}/${locale}`}
                  label={d.lines}
                  afterBanner
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>


      <div className="-mt-4 mb-6 hidden md:block xl:hidden">
        <Suspense>
          <LineSwitcher
            tabs={(await storeLines(store.id)).map((id) => ({
              id,
              label: {
                NEW: d.lineNew,
                OUTLET: d.lineOutlet,
                PRELOVED: d.lineSecondStory,
              }[id],
            }))}
            home={`${base}/${locale}`}
            label={d.lines}
            afterBanner
          />
        </Suspense>
      </div>

{/* scroll-mt: the sticky header (two rows on phones) must not cover the heading after the jump. */}
      <section id="selection" aria-labelledby="selection-title" className="scroll-mt-32 md:scroll-mt-24">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="selection-title" className="min-w-0 text-xl font-bold sm:text-2xl">
            {d.ourSelection}
          </h2>
          <Link
            href={withLine(`${base}/${locale}/products`, asked)}
            className="shrink-0 rounded text-sm font-semibold underline-offset-4 hover:text-accent hover:underline"
          >
            <span>{d.viewAll}</span>
          </Link>
        </div>
        {cards.length === 0 ? (
          <p className="text-muted">{d.noProducts}</p>
        ) : (
          <ProductGrid
            cards={cards}
            moreHref={hasMore ? withLine(moreHref(`${base}/${locale}`, limit), asked) : null}
            base={base}
            locale={locale}
            currency={store.currency}
            labels={gridLabels(d, store.locales)}
            preloadFirst
          />
        )}
      </section>

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
