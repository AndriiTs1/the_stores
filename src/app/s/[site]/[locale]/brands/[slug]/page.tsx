import { notFound } from "next/navigation";
import { cache } from "react";
import { Listing } from "@/components/listing";
import { db } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";

const load = cache(async (site: string, rawLocale: string, slug: string) => {
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const item = await db.brand.findUnique({ where: { storeId_slug: { storeId: store.id, slug } } });
  if (!item) notFound();
  return { store, locale, item };
});

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/brands/[slug]">) {
  const { site, locale, slug } = await params;
  const { item } = await load(site, locale, slug);
  return {
    title: item.name,
    alternates: await languageAlternates(site, `/brands/${slug}`),
  };
}

export default async function BrandPage({ params, searchParams }: PageProps<"/s/[site]/[locale]/brands/[slug]">) {
  const { site, locale: rawLocale, slug } = await params;
  const query = await searchParams;
  const { store, locale, item } = await load(site, rawLocale, slug);
  const base = await getBase();
  return (
    <Listing
      title={item.name}
      where={{ brandId: item.id }}
      path={`${base}/${locale}/brands/${slug}`}
      query={query}
      storeId={store.id}
      locale={locale}
      base={base}
      currency={store.currency}
      d={getDict(locale)}
      locales={store.locales}
    />
  );
}
