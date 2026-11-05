import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n";
import { ARCHIVO, ARCHIVO_EXPANDED, imageSrc, OG, ogFonts } from "@/lib/og";
import { getStoreAndLocale } from "@/lib/tenant";

/**
 * Link preview of a store (every page of it that has no image of its own), per language. All text comes from the
 * store settings: the message bar (else the banner's small line) above the store name, the banner line below, and
 * the first three products of the catalogue on the right.
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
    take: 3,
  });
  const pictures = (await Promise.all(products.map((p) => imageSrc(p.images[0])))).filter((p) => p != null);
  const eyebrow = tr(store.announcement, locale) || tr(store.bannerEyebrow, locale);
  const line = tr(store.bannerText, locale);
  const name = store.name.toUpperCase();
  // Long names get smaller so the longest word still fits the text column.
  const longestWord = Math.max(...name.split(/\s+/).map((w) => w.length));
  const nameSize = Math.min(96, Math.floor(560 / (longestWord * 0.78)));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: OG.banner,
          padding: "0 64px 0 72px",
          fontFamily: ARCHIVO,
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingRight: 24 }}>
          {eyebrow && (
            <div
              style={{
                color: OG.accent,
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              {eyebrow}
            </div>
          )}
          <div
            style={{
              fontFamily: ARCHIVO_EXPANDED,
              fontWeight: 700,
              fontSize: nameSize,
              lineHeight: 1,
              letterSpacing: -1,
              color: OG.foreground,
            }}
          >
            {name}
          </div>
          {line && (
            <div style={{ marginTop: 28, fontSize: 30, lineHeight: 1.3, color: OG.bannerText, textWrap: "balance" }}>
              {line}
            </div>
          )}
        </div>
        {pictures.length > 0 && (
          <div style={{ display: "flex", alignItems: "center" }}>
            {pictures.map((src, i) => (
              // The middle one sits higher: three cards in a gentle wave.
              <img
                key={i}
                src={src}
                alt=""
                width={140}
                height={187}
                style={{
                  marginLeft: i ? 12 : 0,
                  marginTop: i === 1 ? -44 : 44,
                  borderRadius: 12,
                  objectFit: "cover",
                }}
              />
            ))}
          </div>
        )}
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
