"use client";

import Form from "next/form";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";

type Props = { action: string; labels: { placeholder: string; submit: string }; className?: string };

/**
 * Header search: a GET form to /<locale>/search?q=… (next/form: client-side navigation, works without JS).
 * On the search page it shows the current query.
 */
export function SearchForm(props: Props) {
  return (
    <Suspense fallback={<SearchFormView {...props} query="" />}>
      <SearchFormWithQuery {...props} />
    </Suspense>
  );
}

function SearchFormWithQuery(props: Props) {
  const onSearchPage = usePathname().endsWith("/search");
  const q = useSearchParams().get("q") ?? "";
  // key: a new search from elsewhere resets the field to that query.
  return <SearchFormView key={onSearchPage ? q : ""} {...props} query={onSearchPage ? q : ""} />;
}

function SearchFormView({ action, labels, className = "", query }: Props & { query: string }) {
  return (
    <Form action={action} role="search" className={`relative ${className}`}>
      <input
        type="search"
        name="q"
        defaultValue={query}
        aria-label={labels.placeholder}
        placeholder={labels.placeholder}
        maxLength={100}
        enterKeyHint="search"
        className="input text-ellipsis pl-4 pr-11 [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="submit"
        aria-label={labels.submit}
        className="absolute right-1 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-foreground"
      >
        <MagnifyingGlass aria-hidden size={18} weight="bold" />
      </button>
    </Form>
  );
}
