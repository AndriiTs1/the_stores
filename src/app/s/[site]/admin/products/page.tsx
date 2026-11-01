import Link from "next/link";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { getBase, getStore } from "@/lib/tenant";
import { StatusBadge } from "../status-badge";

export default async function AdminProducts({ params }: PageProps<"/s/[site]/admin/products">) {
  const { site } = await params;
  const store = await getStore(site);
  const base = await getBase();

  const products = await db.product.findMany({
    where: { storeId: store.id },
    include: { category: true, variants: { include: { inventory: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black tracking-tight">Products</h1>
      <div className="overflow-x-auto rounded-lg bg-background ring-1 ring-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Variants</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => {
              const stock = p.variants.flatMap((v) => v.inventory).reduce((s, i) => s + i.quantity, 0);
              const prices = p.variants.map((v) => v.price);
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              return (
                <tr key={p.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`${base}/admin/products/${p.id}`} className="hover:underline">
                      {tr(p.title, "de")}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category ? tr(p.category.name, "de") : "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">{p.variants.length}</td>
                  <td className={`px-4 py-3 ${stock === 0 ? "font-semibold text-accent" : ""}`}>{stock}</td>
                  <td className="px-4 py-3 text-right">
                    {formatMoney(min, "de", store.currency)}
                    {max !== min && ` – ${formatMoney(max, "de", store.currency)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
