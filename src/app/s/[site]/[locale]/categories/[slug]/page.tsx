import { notFound } from "next/navigation";
import { cache } from "react";
import { Listing } from "@/components/listing";
import { db } from "@/lib/db";
import { getDict, tr } from "@/lib/i18n";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";

const load = cache(async (site: string, rawLocale: string, slug: string) => {
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const item = await db.category.findUnique({ where: { storeId_slug: { storeId: store.id, slug } } });
  if (!item) notFound();
  return { store, locale, item };
});

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/categories/[slug]">) {
  const { site, locale, slug } = await params;
  const { item } = await load(site, locale, slug);
  return {
    title: tr(item.name, locale),
    alternates: await languageAlternates(site, `/categories/${slug}`),
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/s/[site]/[locale]/categories/[slug]">) {
  const { site, locale: rawLocale, slug } = await params;
  const { n } = await searchParams;
  const { store, locale, item } = await load(site, rawLocale, slug);
  const base = await getBase();
  return (
    <Listing
      title={tr(item.name, locale)}
      where={{ categoryId: item.id }}
      path={`${base}/${locale}/categories/${slug}`}
      n={n}
      storeId={store.id}
      locale={locale}
      base={base}
      currency={store.currency}
      d={getDict(locale)}
    />
  );
}
