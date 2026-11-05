import { AccountContent } from "@/components/account-content";
import { getDict } from "@/lib/i18n";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/account">) {
  const { site, locale } = await params;
  return { title: getDict(locale).account, alternates: await languageAlternates(site, "/account") };
}

/** The account menu as a page (direct address); on phones the bottom bar opens it as a side panel instead. */
export default async function AccountPage({ params }: PageProps<"/s/[site]/[locale]/account">) {
  const { site, locale: rawLocale } = await params;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const d = getDict(locale);
  return (
    <>
      <h1 className="mb-2 text-2xl font-black tracking-tight sm:text-3xl">{d.account}</h1>
      <AccountContent locales={store.locales} locale={locale} base={base} d={d} heading="h2" fallbackPath="/account" />
    </>
  );
}
