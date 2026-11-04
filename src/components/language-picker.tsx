"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { LANGUAGE_NAMES } from "@/lib/i18n";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, switchLocaleHref } from "@/lib/locale-path";

const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

/** href of the current page in another language: only the locale segment changes, query and #hash stay. */
function useLocaleHref(base: string) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => "",
  );
  const here = `${pathname}${search ? `?${search}` : ""}${hash}`;
  return (locale: string) => switchLocaleHref(here, base, locale);
}

/**
 * One look for a language everywhere (header, account screen): the current one red and bold with
 * a 2px red line under the letters, no circle or plate; the others grey, dark on hover or press. 44×44 tap area.
 */
const languageClass = (selected: boolean) =>
  `inline-flex size-11 items-center justify-center rounded text-[13px] uppercase ${
    selected
      ? "font-bold text-accent underline decoration-2 underline-offset-[6px]"
      : "font-medium text-meta hover:text-foreground active:text-foreground"
  }`;

const remember = (locale: string) => {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
};

/**
 * DE FR IT EN as plain text in the shared language style: in the header from md, on the account screen on phones.
 * Links to the same page in that language (no scroll to top), remembered in the NEXT_LOCALE cookie.
 */
export function LanguageButtons({ locales, current, base }: { locales: string[]; current: string; base: string }) {
  const hrefFor = useLocaleHref(base);
  return <LanguageButtonRow locales={locales} current={current} hrefFor={hrefFor} />;
}

/** Server fallback while useSearchParams suspends: same look, links to each language's store root. */
export function LanguageButtonsFallback({
  locales,
  current,
  base,
}: {
  locales: string[];
  current: string;
  base: string;
}) {
  return <LanguageButtonRow locales={locales} current={current} hrefFor={(l) => `${base}/${l}`} />;
}

function LanguageButtonRow({
  locales,
  current,
  hrefFor,
}: {
  locales: string[];
  current: string;
  hrefFor: (l: string) => string;
}) {
  return (
    // translate="no": browser translators must not turn "DE FR IT EN" into other words.
    <div translate="no" className="flex">
      {locales.map((l) => (
        <Link
          key={l}
          href={hrefFor(l)}
          hrefLang={l}
          lang={l}
          scroll={false}
          aria-label={LANGUAGE_NAMES[l] ?? l}
          aria-current={l === current ? "true" : undefined}
          onClick={() => remember(l)}
          className={languageClass(l === current)}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
