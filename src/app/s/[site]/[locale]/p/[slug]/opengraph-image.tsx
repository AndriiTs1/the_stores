import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n";
import { discountLabel, discountPercent, formatMoney } from "@/lib/money";
import { ARCHIVO, ARCHIVO_EXPANDED, imageSrc, OG, ogFonts } from "@/lib/og";
import { getStoreAndLocale } from "@/lib/tenant";

/**
 * Link preview of a product: its photo on the left; the store name, product name and price on the right.
 * The price is the cheapest variant's, as on the product card, with the former price and −X% when it is reduced.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ site: string; locale: string; slug: string }> }) {
  const { site, locale: rawLocale, slug } = await params;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const product = await db.product.findUnique({
    where: { storeId_slug: { storeId: store.id, slug } },
    include: { variants: { select: { price: true, compareAtPrice: true } }, brand: { select: { name: true } } },
  });
  if (!product || product.status !== "ACTIVE") notFound();

  const cheapest = product.variants.reduce<(typeof product.variants)[number] | null>(
    (min, v) => (min == null || v.price < min.price ? v : min),
    null,
  );
  const discount = cheapest ? discountPercent(cheapest.price, cheapest.compareAtPrice) : null;
  const money = (rappen: number) => formatMoney(rappen, locale, store.currency);
  const picture = await imageSrc(product.images[0]);
  const title = tr(product.title, locale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: OG.banner,
          padding: 56,
          fontFamily: ARCHIVO,
          color: OG.foreground,
        }}
      >
        {picture ? (
          <img src={picture} alt="" width={389} height={518} style={{ borderRadius: 16, objectFit: "cover" }} />
        ) : (
          <div style={{ width: 389, height: 518, borderRadius: 16, background: OG.white }} />
        )}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingLeft: 64 }}>
          <div style={{ fontFamily: ARCHIVO_EXPANDED, fontWeight: 700, fontSize: 28, letterSpacing: 0 }}>
            {store.name.toUpperCase()}
          </div>
          {product.brand && (
            <div style={{ marginTop: 40, fontSize: 26, fontWeight: 600, color: OG.meta }}>{product.brand.name}</div>
          )}
          <div
            style={{
              marginTop: product.brand ? 8 : 40,
              fontSize: title.length > 28 ? 52 : 64,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: -1,
            }}
          >
            {title}
          </div>
          {cheapest && (
            <div style={{ marginTop: 36, display: "flex", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontSize: 48, fontWeight: 600, color: discount ? OG.accent : OG.foreground }}>
                {money(cheapest.price)}
              </div>
              {discount && cheapest.compareAtPrice && (
                <div
                  style={{ marginLeft: 20, fontSize: 32, color: OG.meta, textDecoration: "line-through" }}
                >
                  {money(cheapest.compareAtPrice)}
                </div>
              )}
              {discount && (
                <div
                  style={{
                    marginLeft: 20,
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: OG.accent,
                    color: OG.white,
                    fontSize: 30,
                    fontWeight: 600,
                  }}
                >
                  {discountLabel(discount)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
