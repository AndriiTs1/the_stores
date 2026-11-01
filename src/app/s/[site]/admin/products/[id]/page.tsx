import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n";
import { getBase, getStore } from "@/lib/tenant";
import { updateProduct } from "../../actions";
import { ProductForm, type ProductFormData } from "./product-form";

export default async function AdminProduct({ params }: PageProps<"/s/[site]/admin/products/[id]">) {
  const { site, id } = await params;
  const store = await getStore(site);
  const base = await getBase();

  const [product, locations] = await Promise.all([
    db.product.findFirst({
      where: { id, storeId: store.id },
      include: { variants: { include: { inventory: true }, orderBy: { position: "asc" } } },
    }),
    db.location.findMany({ where: { storeId: store.id }, orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  const title = product.title as Record<string, string>;
  const data: ProductFormData = {
    title: { de: title.de ?? "", fr: title.fr ?? "", it: title.it ?? "", en: title.en ?? "" },
    status: product.status,
    locations: locations.map((l) => ({ id: l.id, name: l.name })),
    variants: product.variants.map((v) => ({
      id: v.id,
      label: Object.values(v.options as Record<string, string>).join(" / "),
      sku: v.sku,
      price: (v.price / 100).toFixed(2),
      stock: locations.map((loc) => {
        const level = v.inventory.find((i) => i.locationId === loc.id);
        return { locationId: loc.id, levelId: level?.id ?? null, quantity: level?.quantity ?? 0 };
      }),
    })),
  };

  return (
    <ProductForm
      action={updateProduct.bind(null, site, product.id)}
      product={data}
      heading={tr(product.title, "de")}
      viewHref={`${base}/${store.defaultLocale}/p/${product.slug}`}
      backHref={`${base}/admin/products`}
    />
  );
}
