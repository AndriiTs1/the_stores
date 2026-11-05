
/**
 * The store's three parts: Outlet, Neu, Second Story (PRELOVED in the database). The choice is ?line= in the address
 * and travels with every link to a listing; without it a listing shows the first non-empty line in this order.
 */
export type LineId = "OUTLET" | "NEW" | "PRELOVED";

export const LINE_ORDER: LineId[] = ["OUTLET", "NEW", "PRELOVED"];

const SLUG: Record<LineId, string> = { OUTLET: "outlet", NEW: "new", PRELOVED: "second-story" };
const BY_SLUG = Object.fromEntries(Object.entries(SLUG).map(([id, slug]) => [slug, id as LineId]));

export const lineSlug = (line: LineId) => SLUG[line];

/** The line asked for in the query (?line=outlet|new|second-story); null for none or anything else. */
export function parseLine(value: unknown): LineId | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" ? (BY_SLUG[v] ?? null) : null;
}

/** The line a listing shows: the one asked for if it has products, else the first one in order that has. */
export function resolveLine(asked: LineId | null, available: LineId[]): LineId | null {
  if (asked && available.includes(asked)) return asked;
  return LINE_ORDER.find((l) => available.includes(l)) ?? null;
}

/** `href` with ?line= added (or replaced); `line` null leaves it without. */
export function withLine(href: string, line: LineId | null): string {
  const [path, hash = ""] = href.split("#");
  const [base, query = ""] = path.split("?");
  const q = new URLSearchParams(query);
  q.delete("line");
  if (line) q.set("line", SLUG[line]);
  const s = q.toString();
  return `${base}${s ? `?${s}` : ""}${hash ? `#${hash}` : ""}`;
}
