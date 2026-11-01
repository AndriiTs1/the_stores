import { z } from "zod";
import type { Locale } from "./i18n";

/**
 * One zod schema per form, shared by the browser (react-hook-form) and the Server Action.
 * Error messages are codes; errorText() turns them into text in the page language.
 */

export const COUNTRIES = ["CH", "LI"] as const;

const requiredText = () => z.string({ error: "required" }).trim().min(1, "required");

export const checkoutSchema = z.object({
  email: requiredText()
    .max(200, "tooLong")
    .pipe(z.email({ error: "email" })),
  phone: z
    .string()
    .trim()
    .max(40, "tooLong")
    .regex(/^[\d\s+()\-/]*$/, "phone")
    .optional(),
  name: requiredText().min(2, "tooShort").max(120, "tooLong"),
  street: requiredText().min(3, "tooShort").max(200, "tooLong"),
  zip: requiredText().regex(/^\d{4}$/, "zip"), // Swiss / Liechtenstein postcodes
  city: requiredText().min(2, "tooShort").max(100, "tooLong"),
  country: z.enum(COUNTRIES, { error: "country" }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export const ORDER_STATUSES = ["PENDING", "PAID", "FULFILLED", "CANCELLED", "REFUNDED"] as const;

/** "49.90" / "49,9" / "49" → 4990 Rappen. */
const priceSchema = z
  .string({ error: "required" })
  .trim()
  .min(1, "required")
  .regex(/^\d{1,6}([.,]\d{1,2})?$/, "price")
  .transform((v) => Math.round(Number(v.replace(",", ".")) * 100));

const stockSchema = z
  .string({ error: "required" })
  .trim()
  .min(1, "required")
  .regex(/^\d{1,6}$/, "stock")
  .transform(Number);

const optionalText = z.string().trim().max(200, "tooLong").optional();

/** Admin product form. Field names: title_de, prices.<variantId>, stock.<inventoryLevelId>. */
export const productUpdateSchema = z.object({
  status: z.enum(PRODUCT_STATUSES, { error: "status" }),
  title_de: requiredText().max(200, "tooLong"),
  title_fr: optionalText,
  title_it: optionalText,
  title_en: optionalText,
  prices: z.record(z.string(), priceSchema),
  stock: z.record(z.string(), stockSchema),
});

export const orderStatusSchema = z.enum(ORDER_STATUSES);

/** Add to cart from the product page: 1..99 of an existing variant (stock is checked on the server). */
export const addToCartSchema = z.object({
  variantId: z.string({ error: "variant" }).min(1, "variant"),
  quantity: z
    .union([z.number(), z.string().trim().regex(/^\d+$/, "quantity").transform(Number)], { error: "quantity" })
    .pipe(z.number().int().min(1, "quantity").max(99, "quantity")),
});

/** Cart line update — from the stepper (number) or the no-JS form (string). 0 removes the line. */
export const cartLineSchema = z.object({
  variantId: z.string().min(1),
  // "" is rejected (not coerced to 0), so an emptied field never removes the line.
  quantity: z
    .union([z.number(), z.string().trim().regex(/^\d+$/).transform(Number)])
    .pipe(z.number().int().min(0).max(99)),
});

export type FieldErrors = Record<string, string>;

/** First error code per field, keyed by the dotted path ("email", "prices.<id>"). */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".");
    out[key] ??= issue.message;
  }
  return out;
}

const deErrors = {
  required: "Pflichtfeld.",
  email: "Bitte gib eine gültige E-Mail-Adresse ein.",
  phone: "Nur Ziffern, Leerzeichen und + ( ) - / erlaubt.",
  tooShort: "Zu kurz.",
  tooLong: "Zu lang.",
  zip: "Die PLZ hat genau 4 Ziffern.",
  country: "Bitte wähle ein Land.",
  price: "Preis im Format 49.90.",
  stock: "Ganze Zahl ab 0.",
  status: "Ungültiger Status.",
  invalid: "Ungültiger Wert.",
  quantity: "Bitte eine Menge von 1 bis 99 wählen.",
  variant: "Diese Variante ist nicht verfügbar.",
};

export type ErrorCode = keyof typeof deErrors;

/** Every locale must define every code. */
const messages: Record<Locale, Record<ErrorCode, string>> = {
  de: deErrors,
  fr: {
    required: "Champ obligatoire.",
    email: "Veuillez saisir une adresse e-mail valide.",
    phone: "Seuls les chiffres, espaces et + ( ) - / sont autorisés.",
    tooShort: "Trop court.",
    tooLong: "Trop long.",
    zip: "Le NPA comporte exactement 4 chiffres.",
    country: "Veuillez choisir un pays.",
    price: "Prix au format 49.90.",
    stock: "Nombre entier à partir de 0.",
    status: "Statut non valide.",
    invalid: "Valeur non valide.",
    quantity: "Veuillez choisir une quantité de 1 à 99.",
    variant: "Cette variante n'est pas disponible.",
  },
  it: {
    required: "Campo obbligatorio.",
    email: "Inserisci un indirizzo e-mail valido.",
    phone: "Sono ammessi solo cifre, spazi e + ( ) - /.",
    tooShort: "Troppo corto.",
    tooLong: "Troppo lungo.",
    zip: "Il NPA ha esattamente 4 cifre.",
    country: "Scegli un paese.",
    price: "Prezzo nel formato 49.90.",
    stock: "Numero intero da 0.",
    status: "Stato non valido.",
    invalid: "Valore non valido.",
    quantity: "Scegli una quantità da 1 a 99.",
    variant: "Questa variante non è disponibile.",
  },
  en: {
    required: "Required.",
    email: "Please enter a valid email address.",
    phone: "Only digits, spaces and + ( ) - / are allowed.",
    tooShort: "Too short.",
    tooLong: "Too long.",
    zip: "The postcode has exactly 4 digits.",
    country: "Please choose a country.",
    price: "Price in the format 49.90.",
    stock: "Whole number from 0.",
    status: "Invalid status.",
    invalid: "Invalid value.",
    quantity: "Please choose a quantity from 1 to 99.",
    variant: "This variant is not available.",
  },
};

export function errorText(code: string | undefined, locale: string): string {
  if (!code) return "";
  const m = messages[locale as Locale] ?? messages.de;
  return code in m ? m[code as ErrorCode] : m.invalid;
}
