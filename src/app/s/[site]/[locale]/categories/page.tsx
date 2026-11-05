import Link from "next/link";
import { CaretDown, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db";
import { getDict, tr } from "@/lib/i18n";
import { parseLine, resolveLine, withLine } from "@/lib/lines";
import { storeLines } from "@/lib/store-lines";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/categories">) {
  const { site, locale } = await params;
  return { title: getDict(locale).categories, alternates: await languageAlternates(site, "/categories") };
}

const row = "flex min-h-14 items-center justify-between gap-3 py-3 text-base font-semibold";

/**
 * The phone's "Categories" tab: the store's collections (Herren, Damen, …), each opening on a tap to the
 * categories that have products in it (in the part of the store asked for, ?line=, which the links keep).
 * <details>: opens without JavaScript and is announced as expandable.
 */
export default async function CategoriesPage({ params, searchParams }: PageProps<"/s/[site]/[locale]/categories">) {
  const { site, locale: rawLocale } = await params;
  const asked = parseLine((await searchParams).line);
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const d = getDict(locale);
  const line = resolveLine(asked, await storeLines(store.id));
  const active = { storeId: store.id, status: "ACTIVE" as const, ...(line && { line }) };
  const collections = await db.collection.findMany({
    where: { storeId: store.id, inNav: true },
    orderBy: { position: "asc" },
  });
  const groups = await Promise.all(
    collections.map(async (c) => ({
      collection: c,
      categories: await db.category.findMany({
        where: { storeId: store.id, products: { some: { ...active, collections: { some: { id: c.id } } } } },
        orderBy: { position: "asc" },
      }),
    })),
  );

  return (
    <>
      <h1 className="mb-4 text-2xl font-black tracking-tight sm:text-3xl">{d.categories}</h1>
      <ul className="divide-y divide-line border-y border-line">
        {groups.map(({ collection: c, categories }) => {
          const href = `${base}/${locale}/collections/${c.slug}`;
          const keep = (h: string) => withLine(h, asked);
          const name = tr(c.name, locale);
          return (
            <li key={c.id}>
              {categories.length === 0 ? (
                <Link href={keep(href)} className={row}>
                  <span className="min-w-0 hyphens-auto break-words">{name}</span>
                  <CaretRight aria-hidden size={18} className="shrink-0 text-meta" />
                </Link>
              ) : (
                <details className="group">
                  <summary className={`${row} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                    <span className="min-w-0 hyphens-auto break-words">{name}</span>
                    <CaretDown aria-hidden size={18} className="shrink-0 text-meta transition-transform group-open:rotate-180" />
                  </summary>
                  <ul className="pb-3 pl-4">
                    <li>
                      <Link href={keep(href)} className="flex min-h-11 items-center text-sm font-semibold hover:text-accent">
                        {d.viewAll}
                      </Link>
                    </li>
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          href={keep(`${href}?category=${encodeURIComponent(cat.slug)}`)}
                          className="flex min-h-11 items-center text-sm hover:text-accent"
                        >
                          <span className="min-w-0 hyphens-auto break-words">{tr(cat.name, locale)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
