import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n";
import { discountLabel, discountPercent, formatMoney } from "@/lib/money";
import { ARCHIVO_EXPANDED, imageSrc, OG, ogFonts } from "@/lib/og";
import { OutlineBackdrop, Ribbon } from "@/lib/og-backdrop";
import { getStoreAndLocale } from "@/lib/tenant";

/**
 * Link preview of a product, in the store image's style: on black with the outlined store name behind, the photo on
 * a tilted white card at the left, name and price at the right, the store name small at the bottom. The price is the
 * cheapest variant's, as on the product card; reduced: red, the former price struck through, a red ribbon with −X%.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ site: string; locale: string; slug: string }> }) {
  const { site, locale: rawLocale, slug } = await params;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const product = await db.product.findUnique({
    where: { storeId_slug: { storeId: store.id, slug } },
    include: { variants: { select: { price: true, compareAtPrice: true } } },
  });
  if (!product || product.status !== "ACTIVE") notFound();

  const cheapest = product.variants.reduce<(typeof product.variants)[number] | null>(
    (min, v) => (min == null || v.price < min.price ? v : min),
    null,
  );
  const discount = cheapest ? discountPercent(cheapest.price, cheapest.compareAtPrice) : null;
  const money = (rappen: number) => formatMoney(rappen, locale, store.currency);
  const picture = await imageSrc(product.images[0], {});
  const title = tr(product.title, locale).toUpperCase();
  const name = store.name.toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: OG.black,
          fontFamily: ARCHIVO_EXPANDED,
          color: OG.white,
        }}
      >
        <OutlineBackdrop name={name} />

        <div
          style={{
            position: "absolute",
            top: 64,
            left: 72,
            width: 375,
            height: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 18,
            background: OG.white,
            transform: "rotate(-4deg)",
          }}
        >
          {picture && <img src={picture} alt="" width={330} height={440} style={{ objectFit: "contain" }} />}
        </div>
        {discount && (
          <Ribbon
            phrases={[discountLabel(discount)]}
            top={452}
            left={290}
            width={260}
            angle={-8}
            fontSize={40}
            height={84}
            once
          />
        )}

        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 540,
            right: 64,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: title.length > 16 ? 56 : 72, lineHeight: 0.95 }}>{title}</div>
          {cheapest && (
            <div style={{ marginTop: 40, display: "flex", alignItems: "baseline", flexWrap: "wrap" }}>
              <div style={{ fontWeight: 900, fontSize: 64, color: discount ? OG.accent : OG.white }}>
                {money(cheapest.price)}
              </div>
              {discount && cheapest.compareAtPrice && (
                <div
                  style={{
                    marginLeft: 24,
                    fontWeight: 800,
                    fontSize: 32,
                    color: OG.struck,
                    textDecoration: "line-through",
                  }}
                >
                  {money(cheapest.compareAtPrice)}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            right: 64,
            bottom: 48,
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: 2,
            color: OG.line,
          }}
        >
          {name}
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
