/** Credit of one photo, as stored in Product.imageCredits. */
export type PhotoCredit = { author: string; authorUrl: string; photoUrl: string; source?: string };

const UTM = "utm_source=the_stores&utm_medium=referral";
const withUtm = (url: string) => `${url}${url.includes("?") ? "&" : "?"}${UTM}`;

/** Credits from the stored JSON; anything malformed is skipped. */
export function photoCredits(value: unknown): PhotoCredit[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (c): c is PhotoCredit =>
      !!c && typeof c === "object" && typeof c.author === "string" && typeof c.authorUrl === "string",
  );
}

/**
 * "Foto: Name / Unsplash" under the product photos, small and grey: the photographer and Unsplash linked with
 * Unsplash's referral parameters (an API rule). One line per photographer.
 */
export function PhotoCredits({ credits, label }: { credits: PhotoCredit[]; label: string }) {
  const unique = credits.filter((c, i) => credits.findIndex((o) => o.authorUrl === c.authorUrl) === i);
  if (unique.length === 0) return null;
  return (
    <p className="space-y-0.5 text-xs text-meta">
      {unique.map((c) => (
        <span key={c.authorUrl} className="block">
          {label}:{" "}
          <a href={withUtm(c.authorUrl)} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
            {c.author}
          </a>{" "}
          /{" "}
          <a
            href={withUtm(`https://unsplash.com/`)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            {c.source ?? "Unsplash"}
          </a>
        </span>
      ))}
    </p>
  );
}
