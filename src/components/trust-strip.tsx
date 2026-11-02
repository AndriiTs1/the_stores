import { ArrowCounterClockwise, CreditCard, SealCheck, Truck } from "@phosphor-icons/react/dist/ssr";
import type { TrustItem } from "@/lib/trust";

const ICONS = { shipping: Truck, returns: ArrowCounterClockwise, original: SealCheck, payment: CreditCard };

/** Shipping, returns, originality, payment — whichever of them the store really offers (lib/trust). */
export function TrustStrip({ items, label }: { items: TrustItem[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={label} className="mt-14 rounded-xl bg-surface px-5 py-6 sm:px-8">
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = ICONS[item.id];
          return (
            <li key={item.id} className="flex items-start gap-3">
              <Icon aria-hidden size={24} className="mt-0.5 shrink-0" />
              <div className="min-w-0 text-sm">
                <p className="font-semibold">{item.title}</p>
                <p className="text-muted">{item.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
