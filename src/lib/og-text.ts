/** Text helpers for the generated link previews (opengraph-image.tsx). */

/**
 * Short season tag from the store's banner line in English or German: "Autumn / Winter 2026" → "AW 26",
 * "Frühling / Sommer 2027" → "SS 27". Null when the line names no season and year.
 */
export function seasonTag(texts: unknown): string | null {
  if (!texts || typeof texts !== "object") return null;
  const t = texts as Record<string, string | undefined>;
  for (const line of [t.en, t.de]) {
    if (!line) continue;
    const year = line.match(/\b(?:19|20)(\d{2})\b/)?.[1];
    if (!year) continue;
    if (/(autumn|fall|herbst).*winter/i.test(line)) return `AW ${year}`;
    if (/(spring|frühling|frühjahr).*(summer|sommer)/i.test(line)) return `SS ${year}`;
  }
  return null;
}

/** A name in at most two lines, split between words so the longer line is as short as possible. */
export function twoLines(name: string): string[] {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return words;
  let best = [words.join(" ")];
  for (let i = 1; i < words.length; i++) {
    const lines = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
    if (best.length === 1 || Math.max(...lines.map((l) => l.length)) < Math.max(...best.map((l) => l.length))) {
      best = lines;
    }
  }
  return best;
}
