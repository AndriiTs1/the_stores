"use client";

import { useEffect } from "react";
import { checkoutDraftKey, clearCheckoutDraft } from "@/lib/checkout-draft";

/** The order exists, so the checkout form draft is no longer needed. */
export function ClearCheckoutDraft({ storeId }: { storeId: string }) {
  useEffect(() => clearCheckoutDraft(checkoutDraftKey(storeId)), [storeId]);
  return null;
}
