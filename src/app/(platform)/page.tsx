import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Platform home: later the marketing site and "create your shop" sign-up.
export default async function PlatformHome() {
  const stores = await db.store.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">The Stores</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Online-Shops für die Schweiz</h1>
      <p className="mt-3 text-muted">
        TWINT, drei Sprachen, Schweizer MwSt. und Post — ohne Umsatzprovision.
      </p>

      <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-muted">Shops</h2>
      <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
        {stores.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{s.name}</p>
              <p className="text-xs text-muted">{s.slug}</p>
            </div>
            <div className="flex gap-2">
              <Link className="btn btn-ghost" href={`/s/${s.slug}`}>
                Shop
              </Link>
              <Link className="btn" href={`/s/${s.slug}/admin`}>
                Admin
              </Link>
            </div>
          </li>
        ))}
        {stores.length === 0 && (
          <li className="p-4 text-sm text-muted">No stores yet — run `npm run db:seed`.</li>
        )}
      </ul>
    </main>
  );
}
