import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getBase, getStore } from "@/lib/tenant";
import { StatusBadge } from "./status-badge";

export default async function AdminDashboard({ params }: PageProps<"/s/[site]/admin">) {
  const { site } = await params;
  const store = await getStore(site);
  const base = await getBase();

  const since = daysAgo(30);
  const [paid, toFulfil, activeProducts, lowStock, recent] = await Promise.all([
    db.order.aggregate({
      where: { storeId: store.id, status: { in: ["PAID", "FULFILLED"] }, createdAt: { gte: since } },
      _sum: { total: true },
      _count: true,
    }),
    db.order.count({ where: { storeId: store.id, status: "PAID" } }),
    db.product.count({ where: { storeId: store.id, status: "ACTIVE" } }),
    db.inventoryLevel.count({ where: { location: { storeId: store.id }, quantity: { lte: 2 } } }),
    db.order.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const stats = [
    { label: "Revenue, 30 days", value: formatMoney(paid._sum.total ?? 0, "de", store.currency) },
    { label: "Orders, 30 days", value: String(paid._count) },
    { label: "To fulfil", value: String(toFulfil) },
    { label: "Active products", value: String(activeProducts) },
    { label: "Variants with ≤ 2 in stock", value: String(lowStock) },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-background p-4 ring-1 ring-line">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-1 text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg bg-background ring-1 ring-line">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href={`${base}/admin/orders`} className="text-sm text-muted hover:text-foreground">
            All orders →
          </Link>
        </div>
        <ul className="divide-y divide-line text-sm">
          {recent.map((o) => (
            <li key={o.id}>
              <Link href={`${base}/admin/orders/${o.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-surface">
                <span className="w-16 font-semibold">#{o.number}</span>
                <span className="flex-1 truncate text-muted">{o.email}</span>
                <StatusBadge status={o.status} />
                <span className="num w-28">{formatMoney(o.total, "de", o.currency)}</span>
              </Link>
            </li>
          ))}
          {recent.length === 0 && <li className="px-4 py-6 text-muted">No orders yet.</li>}
        </ul>
      </section>
    </div>
  );
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}
