/**
 * Letters on a store's generated icon: the first letter of the first two words of its name, in capitals
 * ("The stores" → "TS", "Sport-Haus Meier" → "SH", "Alpina" → "A"). Digits count as letters; "?" for no name.
 */
export function storeInitials(name: string): string {
  const words = name.match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}
