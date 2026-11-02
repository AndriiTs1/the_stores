import Link from "next/link";
import { getPlatformDict } from "@/lib/i18n-platform";
import { DEMO_STORE_SLUG, PLATFORM_NAME } from "@/lib/platform";

// Only what the code does today: storefront languages (lib/i18n), variants and stock per location
// (lib/inventory), cart and order form (lib/cart, lib/orders), orders in the store admin, prices in CHF.
// Not claimed until it is built and tested: payment methods, VAT settings, shipping carriers, own domains.
export default async function PlatformHome({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const t = getPlatformDict(locale);
  const features = [
    { title: t.languagesTitle, text: t.languagesText },
    { title: t.stockTitle, text: t.stockText },
    { title: t.ordersTitle, text: t.ordersText },
  ];

  return (
    <main className="container-page flex-1 py-16 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{PLATFORM_NAME}</p>
      <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">{t.heroTitle}</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">{t.heroText}</p>
      {/* The demo store offers all four languages (prisma/seed.ts), so it opens in the page language. */}
      <Link href={`/s/${DEMO_STORE_SLUG}/${locale}`} className="btn btn-accent mt-8">
        {t.demoButton}
      </Link>

      <ul className="mt-16 grid gap-6 sm:grid-cols-3">
        {features.map((f) => (
          <li key={f.title} className="rounded-lg bg-surface p-5">
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-muted">{f.text}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
