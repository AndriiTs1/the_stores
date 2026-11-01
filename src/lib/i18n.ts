export const SUPPORTED_LOCALES = ["de", "fr", "it", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export type Localized = Partial<Record<Locale, string>>;

/** Pick the text for a locale from a JSON field, falling back to German, then anything. */
export function tr(value: unknown, locale: string): string {
  if (!value || typeof value !== "object") return typeof value === "string" ? value : "";
  const v = value as Record<string, string>;
  return v[locale] ?? v.de ?? Object.values(v)[0] ?? "";
}

const de = {
  shop: "Shop",
  all: "Alle",
  cart: "Warenkorb",
  addToCart: "In den Warenkorb",
  soldOut: "Ausverkauft",
  inStock: "An Lager",
  size: "Grösse",
  color: "Farbe",
  quantity: "Menge",
  remove: "Entfernen",
  update: "Aktualisieren",
  emptyCart: "Dein Warenkorb ist leer.",
  continueShopping: "Weiter einkaufen",
  subtotal: "Zwischensumme",
  shipping: "Versand",
  free: "Gratis",
  total: "Total",
  vatIncluded: "inkl. MwSt.",
  checkout: "Zur Kasse",
  contact: "Kontakt",
  email: "E-Mail",
  name: "Vor- und Nachname",
  phone: "Telefon",
  address: "Strasse und Nr.",
  zip: "PLZ",
  city: "Ort",
  country: "Land",
  payNow: "Jetzt bezahlen",
  thanks: "Vielen Dank für deine Bestellung!",
  orderNumber: "Bestellnummer",
  orderPending: "Zahlung wird bestätigt …",
  orderPaid: "Zahlung erhalten.",
  freeShippingFrom: "Gratisversand ab",
  noProducts: "Noch keine Produkte.",
  testModeNote: "Testmodus: keine echte Zahlung (Stripe ist nicht konfiguriert).",
  stockError: "Ein Artikel ist nicht mehr in dieser Menge verfügbar.",
  checkError: "Bitte prüfe deine Angaben.",
  orderTitle: "Bestellung",
  summary: "Bestellübersicht",
  maxAvailable: "Max. {n} verfügbar",
  increase: "Menge erhöhen",
  decrease: "Menge verringern",
  language: "Sprache",
  languageButton: "Sprache: {name}",
  navHome: "Startseite",
  navSearch: "Suche",
  navFavorites: "Favoriten",
  navAccount: "Konto",
  comingSoon: "Bald verfügbar",
  cartLabelOne: "Warenkorb, {n} Artikel",
  cartLabelOther: "Warenkorb, {n} Artikel",
};

/** Every locale must define exactly the keys of the German dictionary. */
export type DictKey = keyof typeof de;
export type Dict = Record<DictKey, string>;

const dict: Record<Locale, Dict> = {
  de,
  fr: {
    shop: "Boutique",
    all: "Tout",
    cart: "Panier",
    addToCart: "Ajouter au panier",
    soldOut: "Épuisé",
    inStock: "En stock",
    size: "Taille",
    color: "Couleur",
    quantity: "Quantité",
    remove: "Supprimer",
    update: "Mettre à jour",
    emptyCart: "Votre panier est vide.",
    continueShopping: "Continuer les achats",
    subtotal: "Sous-total",
    shipping: "Livraison",
    free: "Gratuite",
    total: "Total",
    vatIncluded: "TVA incluse",
    checkout: "Passer commande",
    contact: "Contact",
    email: "E-mail",
    name: "Prénom et nom",
    phone: "Téléphone",
    address: "Rue et numéro",
    zip: "NPA",
    city: "Localité",
    country: "Pays",
    payNow: "Payer maintenant",
    thanks: "Merci pour votre commande !",
    orderNumber: "Numéro de commande",
    orderPending: "Confirmation du paiement …",
    orderPaid: "Paiement reçu.",
    freeShippingFrom: "Livraison gratuite dès",
    noProducts: "Aucun produit pour le moment.",
    testModeNote: "Mode test : aucun paiement réel (Stripe n'est pas configuré).",
    stockError: "Un article n'est plus disponible dans cette quantité.",
    checkError: "Veuillez vérifier vos informations.",
    orderTitle: "Commande",
    summary: "Récapitulatif",
    maxAvailable: "Max. {n} disponibles",
    increase: "Augmenter la quantité",
    decrease: "Diminuer la quantité",
    language: "Langue",
    languageButton: "Langue : {name}",
    navHome: "Accueil",
    navSearch: "Recherche",
    navFavorites: "Favoris",
    navAccount: "Compte",
    comingSoon: "Bientôt disponible",
    cartLabelOne: "Panier, {n} article",
    cartLabelOther: "Panier, {n} articles",
  },
  it: {
    shop: "Negozio",
    all: "Tutti",
    cart: "Carrello",
    addToCart: "Aggiungi al carrello",
    soldOut: "Esaurito",
    inStock: "Disponibile",
    size: "Taglia",
    color: "Colore",
    quantity: "Quantità",
    remove: "Rimuovi",
    update: "Aggiorna",
    emptyCart: "Il tuo carrello è vuoto.",
    continueShopping: "Continua lo shopping",
    subtotal: "Subtotale",
    shipping: "Spedizione",
    free: "Gratuita",
    total: "Totale",
    vatIncluded: "IVA inclusa",
    checkout: "Vai alla cassa",
    contact: "Contatto",
    email: "E-mail",
    name: "Nome e cognome",
    phone: "Telefono",
    address: "Via e numero",
    zip: "NPA",
    city: "Località",
    country: "Paese",
    payNow: "Paga ora",
    thanks: "Grazie per il tuo ordine!",
    orderNumber: "Numero d'ordine",
    orderPending: "Conferma del pagamento in corso …",
    orderPaid: "Pagamento ricevuto.",
    freeShippingFrom: "Spedizione gratuita da",
    noProducts: "Ancora nessun prodotto.",
    testModeNote: "Modalità test: nessun pagamento reale (Stripe non è configurato).",
    stockError: "Un articolo non è più disponibile in questa quantità.",
    checkError: "Controlla i tuoi dati.",
    orderTitle: "Ordine",
    summary: "Riepilogo",
    maxAvailable: "Max. {n} disponibili",
    increase: "Aumenta la quantità",
    decrease: "Diminuisci la quantità",
    language: "Lingua",
    languageButton: "Lingua: {name}",
    navHome: "Home",
    navSearch: "Ricerca",
    navFavorites: "Preferiti",
    navAccount: "Account",
    comingSoon: "Presto disponibile",
    cartLabelOne: "Carrello, {n} articolo",
    cartLabelOther: "Carrello, {n} articoli",
  },
  en: {
    shop: "Shop",
    all: "All",
    cart: "Cart",
    addToCart: "Add to cart",
    soldOut: "Sold out",
    inStock: "In stock",
    size: "Size",
    color: "Colour",
    quantity: "Quantity",
    remove: "Remove",
    update: "Update",
    emptyCart: "Your cart is empty.",
    continueShopping: "Continue shopping",
    subtotal: "Subtotal",
    shipping: "Shipping",
    free: "Free",
    total: "Total",
    vatIncluded: "incl. VAT",
    checkout: "Checkout",
    contact: "Contact",
    email: "Email",
    name: "First and last name",
    phone: "Phone",
    address: "Street and number",
    zip: "Postcode",
    city: "City",
    country: "Country",
    payNow: "Pay now",
    thanks: "Thank you for your order!",
    orderNumber: "Order number",
    orderPending: "Confirming payment …",
    orderPaid: "Payment received.",
    freeShippingFrom: "Free shipping from",
    noProducts: "No products yet.",
    testModeNote: "Test mode: no real payment (Stripe is not configured).",
    stockError: "An item is no longer available in this quantity.",
    checkError: "Please check your details.",
    orderTitle: "Order",
    summary: "Order summary",
    maxAvailable: "Max. {n} available",
    increase: "Increase quantity",
    decrease: "Decrease quantity",
    language: "Language",
    languageButton: "Language: {name}",
    navHome: "Home",
    navSearch: "Search",
    navFavorites: "Favorites",
    navAccount: "Account",
    comingSoon: "Coming soon",
    cartLabelOne: "Cart, {n} item",
    cartLabelOther: "Cart, {n} items",
  },
};

/** Language names in their own language (endonyms) — shown the same on every page. */
export const LANGUAGE_NAMES: Record<string, string> = { de: "Deutsch", fr: "Français", it: "Italiano", en: "English" };

export function getDict(locale: string): Dict {
  return isLocale(locale) ? dict[locale] : dict.de;
}

/** Option names are stored as keys ("size", "color"); translate the known ones. */
export function optionLabel(name: string, d: Dict) {
  if (name === "size") return d.size;
  if (name === "color") return d.color;
  return name;
}

/**
 * Product.optionValues: { optionName: { germanValue: { fr, it, en } } }.
 * Variants store the German value; anything without a translation is shown as is.
 */
export function optionValueLabel(translations: unknown, name: string, value: string, locale: string): string {
  if (!translations || typeof translations !== "object") return value;
  const byValue = (translations as Record<string, Record<string, Localized> | undefined>)[name];
  return byValue?.[value]?.[locale as Locale] ?? value;
}

/** Same options object with every value translated to `locale`. */
export function translateOptions(
  translations: unknown,
  options: Record<string, string>,
  locale: string,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(options).map(([name, value]) => [name, optionValueLabel(translations, name, value, locale)]),
  );
}
