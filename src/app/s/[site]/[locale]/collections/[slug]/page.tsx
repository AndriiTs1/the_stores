import { notFound } from "next/navigation";
import { cache } from "react";
import { Listing } from "@/components/listing";
import { db } from "@/lib/db";
import { getDict, tr } from "@/lib/i18n";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";

const load = cache(async (site: string, rawLocale: string, slug: string) => {
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const item = await db.collection.findUnique({ where: { storeId_slug: { storeId: store.id, slug } } });
  if (!item) notFound();
  return { store, locale, item };
});

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/collections/[slug]">) {
  const { site, locale, slug } = await params;
  const { item } = await load(site, locale, slug);
  return {
    title: tr(item.name, locale),
    alternates: await languageAlternates(site, `/collections/${slug}`),
  };
}

/** ?category=<slug> narrows the collection to one category ("Herren · T-Shirts", from the categories screen). */
export default async function CollectionPage({ params, searchParams }: PageProps<"/s/[site]/[locale]/collections/[slug]">) {
  const { site, locale: rawLocale, slug } = await params;
  const query = await searchParams;
  const categorySlug = query.category;
  const { store, locale, item } = await load(site, rawLocale, slug);
  const base = await getBase();
  const category =
    typeof categorySlug === "string"
      ? await db.category.findUnique({ where: { storeId_slug: { storeId: store.id, slug: categorySlug } } })
      : null;
  return (
    <Listing
      title={category ? `${tr(item.name, locale)} · ${tr(category.name, locale)}` : tr(item.name, locale)}
      where={{ collections: { some: { id: item.id } }, ...(category && { categoryId: category.id }) }}
      path={`${base}/${locale}/collections/${slug}${category ? `?category=${category.slug}` : ""}`}
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
