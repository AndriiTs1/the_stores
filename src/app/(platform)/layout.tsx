import type { Metadata } from "next";
import "../globals.css";
import { fontVariables } from "../fonts";
import { PLATFORM_NAME } from "@/lib/platform";

export const metadata: Metadata = {
  title: PLATFORM_NAME,
  description: "Multi-tenant e-commerce platform for Swiss shops",
};

// Each area has its own root layout so <html lang> can follow the page:
// (platform) here, the storefront in s/[site]/[locale], the admin in s/[site]/admin.
export default function PlatformLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${fontVariables} h-full antialiased`}
      // Browser translators (e.g. Google Translate) rewrite lang/class on <html>; only this element's attributes.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
