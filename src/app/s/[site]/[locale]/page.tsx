import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { db } from "@/lib/db";
import { getProductCards, PAGE_SIZE } from "@/lib/catalog";
import { getDict, tr } from "@/lib/i18n";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]">) {
  const { site } = await params;
  return { alternates: await languageAlternates(site, "") };
}

export default async function Catalog({ params, searchParams }: PageProps<"/s/[site]/[locale]">) {
  const { site, locale: rawLocale } = await params;
  const { c } = await searchParams;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const d = getDict(locale);
  const activeCategory = typeof c === "string" ? c : undefined;

  const [categories, { cards }] = await Promise.all([
    db.category.findMany({ where: { storeId: store.id }, orderBy: { position: "asc" } }),
    getProductCards(store.id, locale, activeCategory ? { category: { slug: activeCategory } } : {}, PAGE_SIZE * 8),
  ]);

  return (
    <>
      {/* Phone: one scrollable row (no visible scrollbar); wider screens wrap. Row height never changes. */}
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:mb-8 sm:flex-wrap sm:overflow-visible sm:px-0">
        <CategoryPill href={`${base}/${locale}`} active={!activeCategory} label={d.all} />
        {categories.map((cat) => (
          <CategoryPill
            key={cat.id}
            href={`${base}/${locale}?c=${cat.slug}`}
            active={activeCategory === cat.slug}
            label={tr(cat.name, locale)}
          />
        ))}
      </div>

      {cards.length === 0 ? (
        <p className="text-muted">{d.noProducts}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {cards.map((card, i) => (
            <li key={card.id}>
              <ProductCard
                card={card}
                href={`${base}/${locale}/p/${card.slug}`}
                locale={locale}
                currency={store.currency}
                labels={{ soldOut: d.soldOut, sizes: d.sizes }}
                preload={i < 2}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function CategoryPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-inset ${
        active ? "bg-foreground text-background ring-foreground" : "ring-line hover:bg-surface"
      }`}
    >
      {label}
    </Link>
  );
}
