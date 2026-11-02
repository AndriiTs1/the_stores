import { isLocale, type Locale } from "./i18n";

/** Texts of the platform's own pages (landing). Storefront texts stay in i18n.ts. */
const de = {
  language: "Sprache",
  heroTitle: "Online-Shops für die Schweiz",
  heroText: "Ein Shop in vier Sprachen, mit Produktvarianten, Lagerbestand und Bestellungen. Preise in Franken.",
  demoButton: "Demo-Shop ansehen",
  languagesTitle: "Vier Sprachen",
  languagesText: "Jeder Shop auf Deutsch, Französisch, Italienisch und Englisch — die Kundschaft wählt die Sprache.",
  stockTitle: "Varianten und Lager",
  stockText: "Grössen und Farben mit eigenem Bestand. Ausverkaufte Varianten lassen sich nicht bestellen.",
  ordersTitle: "Bestellungen",
  ordersText: "Warenkorb, Bestellformular und eine Bestellübersicht mit Status im Admin.",
  draft: "Entwurf",
  impressum: "Impressum",
  impressumDraft: "Die Angaben zum Betreiber dieser Website werden hier ergänzt, sobald sie feststehen.",
  privacy: "Datenschutzerklärung",
  privacyDraft: "Die Datenschutzerklärung dieser Website wird hier ergänzt, sobald sie feststeht.",
};

/** Every locale must define exactly the keys of the German dictionary. */
export type PlatformDict = Record<keyof typeof de, string>;

const dict: Record<Locale, PlatformDict> = {
  de,
  fr: {
    language: "Langue",
    heroTitle: "Des boutiques en ligne pour la Suisse",
    heroText:
      "Une boutique en quatre langues, avec variantes de produits, gestion du stock et commandes. Prix en francs.",
    demoButton: "Voir la boutique de démo",
    languagesTitle: "Quatre langues",
    languagesText: "Chaque boutique en allemand, français, italien et anglais — la clientèle choisit sa langue.",
    stockTitle: "Variantes et stock",
    stockText: "Tailles et couleurs, chacune avec son stock. Les variantes épuisées ne peuvent pas être commandées.",
    ordersTitle: "Commandes",
    ordersText: "Panier, formulaire de commande et vue d'ensemble des commandes avec leur statut dans l'admin.",
    draft: "Projet",
    impressum: "Mentions légales",
    impressumDraft: "Les informations sur l'exploitant de ce site seront ajoutées ici dès qu'elles seront définies.",
    privacy: "Déclaration de protection des données",
    privacyDraft: "La déclaration de protection des données de ce site sera ajoutée ici dès qu'elle sera définie.",
  },
  it: {
    language: "Lingua",
    heroTitle: "Negozi online per la Svizzera",
    heroText: "Un negozio in quattro lingue, con varianti di prodotto, gestione delle scorte e ordini. Prezzi in franchi.",
    demoButton: "Vedi il negozio demo",
    languagesTitle: "Quattro lingue",
    languagesText: "Ogni negozio in tedesco, francese, italiano e inglese: i clienti scelgono la lingua.",
    stockTitle: "Varianti e scorte",
    stockText: "Taglie e colori, ciascuno con le proprie scorte. Le varianti esaurite non si possono ordinare.",
    ordersTitle: "Ordini",
    ordersText: "Carrello, modulo d'ordine e una panoramica degli ordini con stato nell'admin.",
    draft: "Bozza",
    impressum: "Note legali",
    impressumDraft: "Le informazioni sul gestore di questo sito saranno aggiunte qui non appena definite.",
    privacy: "Informativa sulla protezione dei dati",
    privacyDraft: "L'informativa sulla protezione dei dati di questo sito sarà aggiunta qui non appena definita.",
  },
  en: {
    language: "Language",
    heroTitle: "Online shops for Switzerland",
    heroText: "One shop in four languages, with product variants, stock and orders. Prices in Swiss francs.",
    demoButton: "See the demo shop",
    languagesTitle: "Four languages",
    languagesText: "Every shop in German, French, Italian and English — customers choose their language.",
    stockTitle: "Variants and stock",
    stockText: "Sizes and colours, each with its own stock. Sold-out variants can't be ordered.",
    ordersTitle: "Orders",
    ordersText: "Cart, order form and an order overview with status in the admin.",
    draft: "Draft",
    impressum: "Legal notice",
    impressumDraft: "Details of the operator of this website will be added here once they are final.",
    privacy: "Privacy policy",
    privacyDraft: "The privacy policy of this website will be added here once it is final.",
  },
};

export function getPlatformDict(locale: string): PlatformDict {
  return isLocale(locale) ? dict[locale] : dict.de;
}
