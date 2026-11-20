import Link from "next/link";
import { redirect, forbidden } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/authorization";
import "../../../globals.css";
import { fontVariables } from "../../../fonts";
import { getBase, getStore } from "@/lib/tenant";

export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children, params }: LayoutProps<"/s/[site]/admin">) {
  const { site } = await params;
  const store = await getStore(site);

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [platformMembership, storeMembership] = await Promise.all([
    db.platformMembership.findUnique({ where: { userId: user.id } }),
    db.storeMembership.findUnique({
      where: {
        userId_storeId: {
          userId: user.id,
          storeId: store.id,
        },
      },
    }),
  ]);

  const platformAllowed =
    platformMembership?.role === "OWNER" ||
    platformMembership?.role === "ADMIN";

  if (!platformAllowed && !storeMembership) {
    forbidden();
  }

  const base = await getBase();
  const nav = [
    { href: `${base}/admin`, label: "Dashboard" },
    { href: `${base}/admin/orders`, label: "Orders" },
    { href: `${base}/admin/products`, label: "Products" },
  ];

  // Root layout of the admin area (English UI).
  return (
    <html
      lang="en"
      className={`${fontVariables} h-full antialiased`}
      // Browser translators (e.g. Google Translate) rewrite lang/class on <html>; only this element's attributes.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-surface">
        <header className="border-b border-line bg-background">
          <div className="container-page grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-4 py-4 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-2 sm:py-3">
            <span className="font-black uppercase tracking-tight">{store.name}</span>
            <nav className="col-span-2 row-start-2 flex items-center gap-6 text-sm sm:order-none sm:gap-4">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="text-muted hover:text-foreground">
                  {n.label}
                </Link>
              ))}
            </nav>
            <Link href={`${base}/${store.defaultLocale}`} className="col-start-2 row-start-1 text-sm text-muted hover:text-foreground sm:ml-auto">
              View shop ↗
            </Link>
          </div>
        </header>
        <main className="container-page flex-1 py-6 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
