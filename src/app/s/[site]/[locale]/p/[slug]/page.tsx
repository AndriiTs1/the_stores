import { notFound } from "next/navigation";
import { ProductImage } from "@/components/product-image";
import { db } from "@/lib/db";
import { getDict, optionLabel, optionValueLabel, tr } from "@/lib/i18n";
import { inventoryInclude, onlineStock } from "@/lib/inventory";
import { formatMoney } from "@/lib/money";
import { getStoreAndLocale, languageAlternates } from "@/lib/tenant";
import { addToCart } from "../../actions";
import { VariantPicker } from "./variant-picker";

async function loadProduct(site: string, rawLocale: string, slug: string) {
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const product = await db.product.findUnique({
    where: { storeId_slug: { storeId: store.id, slug } },
    include: { variants: { include: inventoryInclude, orderBy: { position: "asc" } } },
  });
  if (!product || product.status !== "ACTIVE") notFound();
  return { store, locale, product };
}

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/p/[slug]">) {
  const { site, locale, slug } = await params;
  const { product } = await loadProduct(site, locale, slug);
  return {
    title: tr(product.title, locale),
    description: tr(product.description, locale),
    alternates: await languageAlternates(site, `/p/${slug}`),
  };
}

export default async function ProductPage({ params, searchParams }: PageProps<"/s/[site]/[locale]/p/[slug]">) {
  const { site, locale: rawLocale, slug } = await params;
  const { v } = await searchParams;
  const { store, locale, product } = await loadProduct(site, rawLocale, slug);
  const d = getDict(locale);
  const title = tr(product.title, locale);

  const variants = product.variants.map((v) => ({
    id: v.id,
    options: v.options as Record<string, string>,
    price: formatMoney(v.price, locale, store.currency),
    compareAt: v.compareAtPrice ? formatMoney(v.compareAtPrice, locale, store.currency) : null,
    stock: onlineStock(v.inventory),
  }));
  // Variants keep the German value; the picker shows it in the page language.
  const valueLabels = Object.fromEntries(
    product.optionNames.map((name) => [
      name,
      Object.fromEntries(
        variants.map((v) => [v.options[name], optionValueLabel(product.optionValues, name, v.options[name], locale)]),
      ),
    ]),
  );

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-10 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="space-y-3">
        <ProductImage src={product.images[0]} title={title} />
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {product.images.slice(1).map((src) => (
              <ProductImage key={src} src={src} title={title} />
            ))}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-xs text-muted">{d.vatIncluded}</p>
        <div className="mt-6">
          <VariantPicker
            initialVariantId={typeof v === "string" ? v : undefined}
            variants={variants}
            optionNames={product.optionNames}
            optionLabels={Object.fromEntries(product.optionNames.map((n) => [n, optionLabel(n, d)]))}
            valueLabels={valueLabels}
            labels={{ addToCart: d.addToCart, soldOut: d.soldOut, inStock: d.inStock, quantity: d.quantity }}
            action={addToCart.bind(null, site, locale)}
          />
        </div>
        {product.description != null && (
          <p className="mt-8 whitespace-pre-line leading-relaxed text-muted">{tr(product.description, locale)}</p>
        )}
      </div>
    </div>
  );
}
