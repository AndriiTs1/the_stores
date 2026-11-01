import Link from "next/link";
import { notFound } from "next/navigation";
import { Select } from "@/components/ui/select";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import type { ShippingAddress } from "@/lib/orders";
import { getBase, getStore } from "@/lib/tenant";
import { ORDER_STATUSES } from "@/lib/validation";
import { setOrderStatus } from "../../actions";
import { StatusBadge } from "../../status-badge";

export default async function AdminOrder({ params }: PageProps<"/s/[site]/admin/orders/[id]">) {
  const { site, id } = await params;
  const store = await getStore(site);
  const base = await getBase();
  const order = await db.order.findFirst({ where: { id, storeId: store.id }, include: { items: true } });
  if (!order) notFound();

  const a = order.shippingAddress as ShippingAddress;
  const fmt = (n: number) => formatMoney(n, "de", order.currency);

  return (
    <div className="space-y-6">
      <Link href={`${base}/admin/orders`} className="text-sm text-muted hover:text-foreground">
        ← Orders
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-black tracking-tight">Order #{order.number}</h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-muted">{order.createdAt.toLocaleString("de-CH")}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="overflow-x-auto rounded-lg bg-background ring-1 ring-line">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-line">
              {order.items.map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{i.title}</p>
                    <p className="text-xs text-muted">
                      {i.sku} · {Object.values(i.options as Record<string, string>).join(" / ")}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted tabular-nums">
                    {i.quantity} × {fmt(i.unitPrice)}
                  </td>
                  <td className="num px-4 py-3">{fmt(i.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="space-y-1 border-t border-line px-4 py-3 text-sm">
            <Row label="Subtotal" value={fmt(order.subtotal)} />
            <Row label="Shipping" value={fmt(order.shipping)} />
            <Row label="Total" value={fmt(order.total)} bold />
            <Row label={`incl. VAT`} value={fmt(order.vatAmount)} muted />
          </dl>
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg bg-background p-4 text-sm ring-1 ring-line">
            <h2 className="mb-2 font-semibold">Customer</h2>
            <p>{a.name}</p>
            <p>{a.street}</p>
            <p>
              {a.country}-{a.zip} {a.city}
            </p>
            <p className="mt-2 text-muted">{order.email}</p>
            {a.phone && <p className="text-muted">{a.phone}</p>}
          </div>

          <div className="rounded-lg bg-background p-4 text-sm ring-1 ring-line">
            <h2 className="mb-2 font-semibold">Payment</h2>
            <p className="text-muted">
              {order.paymentProvider ?? "—"} {order.paidAt && `· ${order.paidAt.toLocaleString("de-CH")}`}
            </p>
            <form action={setOrderStatus.bind(null, site, order.id)} className="mt-4 flex gap-2">
              <Select
                name="status"
                aria-label="Order status"
                defaultValue={order.status}
                options={ORDER_STATUSES.map((s) => ({ value: s, label: s }))}
                className="flex-1"
              />
              <button className="btn h-10 px-4 py-0">Save</button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold" : ""} ${muted ? "text-xs text-muted" : ""}`}>
      <dt>{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}
