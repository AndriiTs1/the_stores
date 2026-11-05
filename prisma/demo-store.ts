/** The demo store's own texts: used by the seed (new store) and update-demo (existing store, in place). */
type L = { de: string; fr: string; it: string; en: string };
const d = (de: string, fr: string, it: string, en: string): L => ({ de, fr, it, en });

export const DEMO_SLUG = "demo";

export const demoStoreTexts = {
  name: "The stores", // shown in capitals by the storefront
  announcement: d(
    "Kollektion Herbst / Winter 2026",
    "Collection automne / hiver 2026",
    "Collezione autunno / inverno 2026",
    "Autumn / Winter 2026 collection",
  ),
  announcementHref: "/", // the catalogue
  bannerEyebrow: d("Herbst / Winter 2026", "Automne / Hiver 2026", "Autunno / Inverno 2026", "Autumn / Winter 2026"),
  bannerTitle: d("Die Kollektion", "La collection", "La collezione", "The collection"),
  bannerEnabled: false, // no banner on the home page; its texts stay for the link previews
  bannerText: d(
    "Sportbekleidung für jeden Tag.",
    "Des vêtements de sport pour tous les jours.",
    "Abbigliamento sportivo per ogni giorno.",
    "Sportswear for every day.",
  ),
};

