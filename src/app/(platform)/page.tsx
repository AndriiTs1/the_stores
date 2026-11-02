import Link from "next/link";
import { DEMO_STORE_SLUG, PLATFORM_NAME } from "@/lib/platform";

// Only what the code does today: storefront languages (lib/i18n), variants and stock per location
// (lib/inventory), cart and order form (lib/cart, lib/orders), orders in the store admin, prices in CHF.
// Not claimed until it is built and tested: payment methods, VAT settings, shipping carriers, own domains.
const features = [
  {
    title: "Vier Sprachen",
    text: "Jeder Shop auf Deutsch, Französisch, Italienisch und Englisch — die Kundschaft wählt die Sprache.",
  },
  {
    title: "Varianten und Lager",
    text: "Grössen und Farben mit eigenem Bestand. Ausverkaufte Varianten lassen sich nicht bestellen.",
  },
  {
    title: "Bestellungen",
    text: "Warenkorb, Bestellformular und eine Bestellübersicht mit Status im Admin.",
  },
];

export default function PlatformHome() {
  return (
    <main className="container-page flex-1 py-16 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{PLATFORM_NAME}</p>
      <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
        Online-Shops für die Schweiz
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        Ein Shop in vier Sprachen, mit Produktvarianten, Lagerbestand und Bestellungen. Preise in Franken.
      </p>
      <Link href={`/s/${DEMO_STORE_SLUG}`} className="btn btn-accent mt-8">
        Demo-Shop ansehen
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
