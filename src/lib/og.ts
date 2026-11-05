import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

/**
 * Shared parts of the generated images (link previews, store icons; next/og ImageResponse).
 * Fonts and demo illustrations are files in the project (next.config.ts traces them into the server bundle),
 * read once per server instance, never fetched from the network.
 */

/** Archivo: Expanded Bold (font-stretch 125%) for the store name, Regular and SemiBold for the rest. */
export const ARCHIVO = "Archivo";
export const ARCHIVO_EXPANDED = "Archivo Expanded";

const fontFile = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));

let fonts: ReturnType<typeof loadFonts> | null = null;
async function loadFonts() {
  const [regular, semibold, expanded] = await Promise.all([
    fontFile("Archivo-Regular.ttf"),
    fontFile("Archivo-SemiBold.ttf"),
    fontFile("ArchivoExpanded-Bold.ttf"),
  ]);
  return [
    { name: ARCHIVO, data: regular, weight: 400 as const, style: "normal" as const },
    { name: ARCHIVO, data: semibold, weight: 600 as const, style: "normal" as const },
    { name: ARCHIVO_EXPANDED, data: expanded, weight: 700 as const, style: "normal" as const },
  ];
}
export function ogFonts() {
  fonts ??= loadFonts();
  return fonts;
}

/** Colours of the storefront theme (globals.css), for images, which can't read CSS variables. */
export const OG = {
  banner: "#ECEBE8",
  accent: "#C8102E",
  foreground: "#111111",
  bannerText: "#3D3D3B",
  meta: "#5E5E5E",
  white: "#FFFFFF",
};

const TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
};

/**
 * An image for <img src> in a generated image: a full URL as it is, a path in /public as a data URI
 * (the image renderer can't load a path). Null for a missing file or an unsupported type.
 */
export async function imageSrc(src: string | null | undefined): Promise<string | null> {
  if (!src) return null;
  if (/^https?:\/\//.test(src)) return src;
  const path = normalize(src.split("?")[0]);
  const type = TYPES[extname(path).toLowerCase()];
  if (!type || !path.startsWith("/") || path.includes("..")) return null;
  try {
    const data = await readFile(join(process.cwd(), "public", path));
    return `data:${type};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}
