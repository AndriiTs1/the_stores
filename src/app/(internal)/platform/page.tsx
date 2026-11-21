import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, requirePlatformRole } from "@/lib/authorization";

export const metadata = { title: "Stores" };

/** Internal store list protected by Better Auth and platform roles. */
export default async function PlatformStores() {

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await requirePlatformRole(["OWNER", "ADMIN"]);

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
