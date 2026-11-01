import type { Dict } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

export function OrderSummary({
  d,
  locale,
  currency,
  subtotal,
  shipping,
  total,
  vatAmount,
  vatRateBp,
}: {
  d: Dict;
  locale: string;
  currency: string;
  subtotal: number;
  shipping: number;
  total: number;
  vatAmount: number;
  vatRateBp: number;
}) {
  const fmt = (n: number) => formatMoney(n, locale, currency);
  // Amount column has a fixed width, so labels in another language never move the numbers.
  const row = "grid grid-cols-[minmax(0,1fr)_8rem] gap-3";
  return (
    <dl className="space-y-2 text-sm">
      <div className={row}>
        <dt>{d.subtotal}</dt>
        <dd className="num">{fmt(subtotal)}</dd>
      </div>
      <div className={row}>
        <dt>{d.shipping}</dt>
        <dd className="num">{shipping === 0 ? d.free : fmt(shipping)}</dd>
      </div>
      <div className={`${row} border-t border-line pt-3 text-base font-bold`}>
        <dt>{d.total}</dt>
        <dd className="num">{fmt(total)}</dd>
      </div>
      <div className={`${row} text-xs text-muted`}>
        <dt>
          {d.vatIncluded} {(vatRateBp / 100).toFixed(1)}%
        </dt>
        <dd className="num">{fmt(vatAmount)}</dd>
      </div>
    </dl>
  );
}
