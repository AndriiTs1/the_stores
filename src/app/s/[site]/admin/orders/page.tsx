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
      <div className="grid grid-cols-3 gap-2 text-sm sm:flex sm:flex-wrap">
        {[undefined, ...Object.values(OrderStatus)].map((s) => (
          <Link
            key={s ?? "all"}
            href={`${base}/admin/orders${s ? `?status=${s}` : ""}`}
            className={`flex min-h-10 items-center justify-center rounded-full px-1 py-2 text-center text-[11px] ring-1 sm:min-h-0 sm:px-3 sm:py-1 sm:text-sm ${
              filter === s ? "bg-foreground text-background ring-foreground" : "bg-background ring-line"
            }`}
          >
            {s ?? "All"}
          </Link>
        ))}
      </div>

      {/* Mobile: order cards */}
      <div className="space-y-3 sm:hidden">
        {orders.length === 0 ? (
          <div className="rounded-xl bg-background px-5 py-12 text-center ring-1 ring-line">
            <p className="text-sm font-medium">No orders yet</p>
            <p className="mt-1 text-xs text-muted">
              New orders will appear here.
            </p>
          </div>
        ) : (
          orders.map((o) => (
            <Link
              key={o.id}
              href={`${base}/admin/orders/${o.id}`}
              className="block rounded-xl bg-background p-4 ring-1 ring-line transition-colors hover:bg-surface"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">#{o.number}</span>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-1 text-xs text-muted">
                {o.createdAt.toLocaleString("de-CH")}
              </p>
              <div className="mt-4 border-t border-line pt-3">
                <p className="break-all text-sm">{o.email}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">
                    {o._count.items} items
                  </span>
                  <span className="font-semibold">
                    {formatMoney(o.total, "de", o.currency)}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Desktop: full orders table */}
      <div className="hidden overflow-x-auto rounded-lg bg-background ring-1 ring-line sm:block">
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
