import { Listing } from "@/components/listing";
import { getDict } from "@/lib/i18n";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/products">) {
  const { site, locale } = await params;
  return { title: getDict(locale).allProducts, alternates: await languageAlternates(site, "/products") };
}

/** Every active product of the store ("View all" on the home page). */
export default async function AllProductsPage({ params, searchParams }: PageProps<"/s/[site]/[locale]/products">) {
  const { site, locale: rawLocale } = await params;
  const { n } = await searchParams;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const d = getDict(locale);
  return (
    <Listing
      title={d.allProducts}
      where={{}}
      path={`${base}/${locale}/products`}
      n={n}
      storeId={store.id}
      locale={locale}
      base={base}
      currency={store.currency}
      d={d}
    />
  );
}
