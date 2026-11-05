import { ImageResponse } from "next/og";
import { ARCHIVO_EXPANDED, imageSrc, OG, ogFonts } from "./og";
import { storeInitials } from "./store-icon";

/**
 * A store's (or the platform's) icon at `px` × `px`: its own icon from the settings (iconUrl) when set, else the
 * initials of its name in white on the accent colour. `rounded`: corners of its own (browser tab, Android); iOS rounds
 * the home-screen icon itself. Small icons get larger letters, so they stay readable in a browser tab.
 */
export async function storeIcon({ name, iconUrl }: { name: string; iconUrl?: string | null }, px: number, rounded: boolean) {
  const own = await imageSrc(iconUrl);
  const initials = storeInitials(name);
  return new ImageResponse(
    own ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={own} alt="" width={px} height={px} style={{ objectFit: "cover", borderRadius: rounded ? px * 0.2 : 0 }} />
    ) : (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: OG.accent,
          borderRadius: rounded ? px * 0.2 : 0,
          color: OG.white,
          fontFamily: ARCHIVO_EXPANDED,
          fontWeight: 700,
          fontSize: px * (initials.length > 1 ? (px <= 48 ? 0.46 : 0.36) : 0.5),
          letterSpacing: px * -0.01,
        }}
      >
        {initials}
      </div>
    ),
    { width: px, height: px, fonts: await ogFonts() },
  );
}
