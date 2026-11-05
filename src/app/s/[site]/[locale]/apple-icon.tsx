import { storeIcon } from "@/lib/store-icon-image";
import { getStore } from "@/lib/tenant";

/** Home-screen icon on iPhone and iPad (apple-touch-icon): square, iOS rounds the corners itself. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  return storeIcon(await getStore(site), 180, false);
}
