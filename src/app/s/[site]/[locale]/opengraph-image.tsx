import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n";
import { ARCHIVO, ARCHIVO_EXPANDED, imageSrc, OG, ogFonts } from "@/lib/og";
import { OutlineBackdrop, Ribbon } from "@/lib/og-backdrop";
import { seasonTag, twoLines } from "@/lib/og-text";
import { getStoreAndLocale } from "@/lib/tenant";

/**
 * Link preview of a store (every page of it that has no image of its own), per language, on black. All text comes
 * from the store settings: the name (outlined in the background, large at the top left), the banner line under it,
 * the message bar text on the red ribbon, the first two catalogue products at the top right, and at the bottom left
 * the season (from the banner's small line) and the store's languages.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ site: string; locale: string }> }) {
  const { site, locale: rawLocale } = await params;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const products = await db.product.findMany({
    where: { storeId: store.id, status: "ACTIVE", images: { isEmpty: false } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { images: true },
    take: 2,
  });
  const pictures = await Promise.all(products.map((p) => imageSrc(p.images[0], { outline: OG.struck })));
  const name = store.name.toUpperCase();
  const lines = twoLines(name);
  // Long names get smaller so the longest line still fits left of the products.
  const nameSize = Math.min(116, Math.floor(700 / (Math.max(...lines.map((l) => l.length)) * 0.95)));
  const eyebrow = (tr(store.announcement, locale) || tr(store.bannerEyebrow, locale)).toUpperCase();
  const line = tr(store.bannerText, locale);
  const season = seasonTag(store.bannerEyebrow);
  const languages = store.locales.map((l) => l.toUpperCase()).join(" · ");

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
          fontFamily: ARCHIVO,
        }}
      >
        <OutlineBackdrop name={name} />
        <Ribbon phrases={eyebrow ? [eyebrow, name] : [name]} top={380} />

        <div style={{ position: "absolute", top: 64, left: 64, display: "flex", flexDirection: "column" }}>
          {lines.map((l) => (
            <div
              key={l}
              style={{
                fontFamily: ARCHIVO_EXPANDED,
                fontWeight: 900,
                fontSize: nameSize,
                lineHeight: 0.86,
                color: OG.white,
                whiteSpace: "nowrap",
              }}
            >
              {l}
            </div>
          ))}
          {line && <div style={{ marginTop: 24, fontSize: 28, color: OG.line, maxWidth: 640 }}>{line}</div>}
        </div>

        {pictures.map(
          (src, i) =>
            src && (
              <img
                key={i}
                src={src}
                alt=""
                width={i ? 128 : 143}
                height={i ? 170 : 190}
                style={{
                  position: "absolute",
                  top: i ? 70 : 40,
                  right: i ? 64 : 200,
                  transform: `rotate(${i ? 4 : -6}deg)`,
                  objectFit: "contain",
                }}
              />
            ),
        )}

        <div style={{ position: "absolute", left: 64, bottom: 56, display: "flex", gap: 14 }}>
          {season && <Pill text={season} border={OG.white} color={OG.white} />}
          <Pill text={languages} border={OG.meta} color={OG.line} />
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}

function Pill({ text, border, color }: { text: string; border: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "10px 22px",
        border: `2px solid ${border}`,
        borderRadius: 999,
        color,
        fontFamily: ARCHIVO_EXPANDED,
        fontWeight: 800,
        fontSize: 20,
        letterSpacing: 1,
      }}
    >
      {text}
    </div>
  );
}
