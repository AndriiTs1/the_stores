import type { Metadata } from "next";
import "../globals.css";
import { fontVariables } from "../fonts";
import { PLATFORM_NAME } from "@/lib/platform";

export const metadata: Metadata = {
  title: { default: PLATFORM_NAME, template: `%s · ${PLATFORM_NAME}` },
  robots: { index: false },
};

// Root layout of the internal platform pages (/platform, /admin/login): English UI like the store admin.
export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fontVariables} h-full antialiased`}
      // Browser translators (e.g. Google Translate) rewrite lang/class on <html>; only this element's attributes.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-surface">{children}</body>
    </html>
  );
}
