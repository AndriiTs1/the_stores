import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import "../../globals.css";
import { fontVariables } from "../../fonts";
import { LanguageButtons, LanguageButtonsFallback } from "@/components/language-picker";
import { isLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { getPlatformDict } from "@/lib/i18n-platform";
import { PLATFORM_NAME } from "@/lib/platform";

export const metadata: Metadata = {
  title: PLATFORM_NAME,
};

// One static page per language; any other first segment is a 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

const locales = [...SUPPORTED_LOCALES];

// Root layout of the platform's own pages: <html lang> is the page language.
export default async function PlatformLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getPlatformDict(locale);

  return (
    <html
      lang={locale}
      className={`${fontVariables} h-full antialiased`}
      // Browser translators (e.g. Google Translate) rewrite lang/class on <html>; only this element's attributes.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <header className="h-14 shadow-[inset_0_-1px_0_var(--line)] md:h-[72px]">
          <div className="container-page flex h-full items-center justify-between gap-3">
            <Link href={`/${locale}`} className="rounded font-display text-base font-bold uppercase tracking-tight">
              {PLATFORM_NAME}
            </Link>
            <nav aria-label={t.language}>
              <Suspense fallback={<LanguageButtonsFallback locales={locales} current={locale} base="" />}>
                <LanguageButtons locales={locales} current={locale} base="" />
              </Suspense>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
