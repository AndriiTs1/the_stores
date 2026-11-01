import Link from "next/link";
import "../../../globals.css";
import { fontVariables } from "../../../fonts";
import { getBase, getStore } from "@/lib/tenant";

export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children, params }: LayoutProps<"/s/[site]/admin">) {
  const { site } = await params;
  const store = await getStore(site);
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
          <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
            <span className="font-black uppercase tracking-tight">{store.name}</span>
            <nav className="flex gap-4 text-sm">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="text-muted hover:text-foreground">
                  {n.label}
                </Link>
              ))}
            </nav>
            <Link href={`${base}/${store.defaultLocale}`} className="ml-auto text-sm text-muted hover:text-foreground">
              View shop ↗
            </Link>
          </div>
        </header>
        <main className="container-page flex-1 py-6 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
