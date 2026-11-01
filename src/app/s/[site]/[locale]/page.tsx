import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { db } from "@/lib/db";
import { getDict, tr } from "@/lib/i18n";
import { inventoryInclude, onlineStock } from "@/lib/inventory";
import { formatMoney } from "@/lib/money";
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

  const [categories, products] = await Promise.all([
    db.category.findMany({ where: { storeId: store.id }, orderBy: { position: "asc" } }),
    db.product.findMany({
      where: {
        storeId: store.id,
        status: "ACTIVE",
        ...(activeCategory ? { category: { slug: activeCategory } } : {}),
      },
      include: { variants: { include: inventoryInclude } },
      orderBy: { createdAt: "asc" },
    }),
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

      {products.length === 0 ? (
        <p className="text-muted">{d.noProducts}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {products.map((p) => {
            const title = tr(p.title, locale);
            const minPrice = Math.min(...p.variants.map((v) => v.price));
            const compareAt = p.variants.find((v) => v.price === minPrice)?.compareAtPrice;
            const soldOut = p.variants.every((v) => onlineStock(v.inventory) === 0);
            return (
              <li key={p.id}>
                <Link href={`${base}/${locale}/p/${p.slug}`} className="group block">
                  <div className="relative">
                    <ProductImage src={p.images[0]} title={title} className="transition group-hover:opacity-90" />
                    {soldOut && (
                      <span className="absolute left-2 top-2 rounded bg-foreground px-2 py-0.5 text-xs font-semibold text-background">
                        {d.soldOut}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-sm tabular-nums">
                    <span className={compareAt ? "font-semibold text-accent" : ""}>
                      {formatMoney(minPrice, locale, store.currency)}
                    </span>
                    {compareAt && (
                      <span className="ml-2 text-muted line-through">
                        {formatMoney(compareAt, locale, store.currency)}
                      </span>
                    )}
                  </p>
                </Link>
              </li>
            );
          })}
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
