"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * The current year on a statically built page: the server renders the build year (`fallback`),
 * the browser switches to its own year right after hydration — no hydration mismatch.
 */
export function CurrentYear({ fallback }: { fallback: number }) {
  return useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => fallback,
  );
}
