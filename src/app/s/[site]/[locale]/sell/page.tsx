import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { getBase, getStoreAndLocale } from "@/lib/tenant";

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/sell">) {
  const { locale } = await params;
  return { title: getDict(locale).sell, robots: { index: false } }; // a placeholder, nothing to find yet
}

/** "Sell": announced in the bottom bar and the header, not built yet. Only says so; collects nothing. */
export default async function SellPage({ params }: PageProps<"/s/[site]/[locale]/sell">) {
  const { site, locale: rawLocale } = await params;
  const { locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const d = getDict(locale);
  return (
    <div className="mx-auto max-w-xl py-10 text-center sm:py-16">
      <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{d.sellTitle}</h1>
      <p className="mt-3 text-muted">{d.sellText}</p>
      <Link href={`${base}/${locale}`} className="btn btn-accent mt-8">
        {d.backToShop}
      </Link>
    </div>
  );
}
