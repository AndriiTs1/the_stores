import { Listing } from "@/components/listing";
import { ON_SALE } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/sale">) {
  const { site, locale } = await params;
  return { title: getDict(locale).sale, alternates: await languageAlternates(site, "/sale") };
}

/** Every product with a reduced price. */
export default async function SalePage({ params, searchParams }: PageProps<"/s/[site]/[locale]/sale">) {
  const { site, locale: rawLocale } = await params;
  const query = await searchParams;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const d = getDict(locale);
  return (
    <Listing
      title={d.sale}
      where={ON_SALE}
      path={`${base}/${locale}/sale`}
      query={query}
      storeId={store.id}
      locale={locale}
      base={base}
      currency={store.currency}
      d={d}
      locales={store.locales}
    />
  );
}
