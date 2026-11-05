import { PLATFORM_NAME } from "@/lib/platform";
import { storeIcon } from "@/lib/store-icon-image";

/** The platform pages' icon: the platform name's initials, drawn like a store icon (lib/store-icon-image). */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return storeIcon({ name: PLATFORM_NAME }, 32, true);
}
