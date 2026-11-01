import { getCartLines } from "@/lib/cart";
import { getDict } from "@/lib/i18n";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";
import { updateCartLine, updateCartLineForm } from "../actions";
import { CartView } from "./cart-view";

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/cart">) {
  const { site, locale } = await params;
  return {
    title: getDict(locale).cart,
    robots: { index: false },
    alternates: await languageAlternates(site, "/cart"),
  };
}

export default async function CartPage({ params }: PageProps<"/s/[site]/[locale]/cart">) {
  const { site, locale: rawLocale } = await params;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const lines = await getCartLines(store.id, locale);

  return (
    <CartView
      initialLines={lines}
      locale={locale}
      base={base}
      currency={store.currency}
      pricing={{
        shippingFlat: store.shippingFlat,
        freeShippingFrom: store.freeShippingFrom,
        vatRateBp: store.vatRateBp,
      }}
      d={getDict(locale)}
      update={updateCartLine.bind(null, site, locale)}
      formAction={updateCartLineForm.bind(null, site, locale)}
    />
  );
}
