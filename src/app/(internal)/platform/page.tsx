import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const metadata = { title: "Stores" };

/**
 * Internal list of all stores. The proxy asks for the admin password; the page checks again,
 * so it never relies on the proxy alone.
 * TODO(phase 1): platform-operator role via StaffUser + StoreMembership instead of ADMIN_PASSWORD.
 */
export default async function PlatformStores() {
  if (!isAdminAuthorized((await headers()).get("authorization"))) notFound();

  const stores = await db.store.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-black tracking-tight">Stores</h1>
      <ul className="mt-6 divide-y divide-line rounded-lg border border-line bg-background">
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
        {stores.length === 0 && <li className="p-4 text-sm text-muted">No stores yet — run `npm run db:seed`.</li>}
      </ul>
    </main>
  );
}
