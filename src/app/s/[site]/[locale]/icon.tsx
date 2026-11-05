import { storeIcon } from "@/lib/store-icon-image";
import { getStore } from "@/lib/tenant";

/** Store icon: 32px for the browser tab, 192 and 512 for Android (lib/store-icon-image). */
const SIZES = [32, 192, 512];

// Prerendered per store on first request; refreshed hourly, so a new icon in the settings shows up.
export const revalidate = 3600;

export function generateImageMetadata() {
  return SIZES.map((px) => ({ id: String(px), size: { width: px, height: px }, contentType: "image/png" }));
}

export default async function Icon({ params, id }: { params: Promise<{ site: string }>; id: Promise<string> }) {
  const [{ site }, px] = await Promise.all([params, id]);
  return storeIcon(await getStore(site), Number(px), true);
}
