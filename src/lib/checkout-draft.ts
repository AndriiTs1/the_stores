import { COUNTRIES, type CheckoutInput } from "./validation";

/** Checkout form draft in sessionStorage, per store: survives a language switch or reload, cleared after ordering. */
export const checkoutDraftKey = (storeId: string) => `checkout-draft:${storeId}`;

export const CHECKOUT_DEFAULTS: CheckoutInput = {
  email: "",
  phone: "",
  name: "",
  street: "",
  zip: "",
  city: "",
  country: "CH",
};

export function readCheckoutDraft(key: string): Partial<CheckoutInput> | null {
  try {
    const raw = sessionStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return null;
    // Only known string fields (and a valid country); anything else in storage is ignored.
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([k, v]) =>
          k in CHECKOUT_DEFAULTS &&
          typeof v === "string" &&
          (k !== "country" || (COUNTRIES as readonly string[]).includes(v)),
      ),
    ) as Partial<CheckoutInput>;
  } catch {
    return null; // storage unavailable (private mode) or corrupt
  }
}

export function clearCheckoutDraft(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}
