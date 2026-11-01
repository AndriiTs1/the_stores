import Link from "next/link";
import { OrderStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getBase, getStore } from "@/lib/tenant";
import { StatusBadge } from "../status-badge";

export default async function AdminOrders({ params, searchParams }: PageProps<"/s/[site]/admin/orders">) {
  const { site } = await params;
  const { status } = await searchParams;
  const store = await getStore(site);
  const base = await getBase();
  const filter = typeof status === "string" && status in OrderStatus ? (status as OrderStatus) : undefined;

  const orders = await db.order.findMany({
    where: { storeId: store.id, ...(filter ? { status: filter } : {}) },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black tracking-tight">Orders</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        {[undefined, ...Object.values(OrderStatus)].map((s) => (
          <Link
            key={s ?? "all"}
            href={`${base}/admin/orders${s ? `?status=${s}` : ""}`}
            className={`rounded-full px-3 py-1 ring-1 ${
              filter === s ? "bg-foreground text-background ring-foreground" : "bg-background ring-line"
            }`}
          >
            {s ?? "All"}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg bg-background ring-1 ring-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-surface">
                <td className="px-4 py-3 font-semibold">
                  <Link href={`${base}/admin/orders/${o.id}`} className="hover:underline">
                    #{o.number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{o.createdAt.toLocaleString("de-CH")}</td>
                <td className="px-4 py-3">{o.email}</td>
                <td className="px-4 py-3">{o._count.items}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="num px-4 py-3">{formatMoney(o.total, "de", o.currency)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
