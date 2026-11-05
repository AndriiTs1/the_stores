import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

/**
 * Shared parts of the generated images (link previews, store icons; next/og ImageResponse).
 * Fonts and demo illustrations are files in the project (next.config.ts traces them into the server bundle),
 * read once per server instance, never fetched from the network.
 */

/**
 * Archivo: Expanded (font-stretch 125%) Black for big names, ExtraBold for the ribbon, Bold for icon letters;
 * Regular and SemiBold for the rest.
 */
export const ARCHIVO = "Archivo";
export const ARCHIVO_EXPANDED = "Archivo Expanded";

const fontFile = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));

let fonts: ReturnType<typeof loadFonts> | null = null;
async function loadFonts() {
  const [regular, semibold, bold, extrabold, black] = await Promise.all([
    fontFile("Archivo-Regular.ttf"),
    fontFile("Archivo-SemiBold.ttf"),
    fontFile("ArchivoExpanded-Bold.ttf"),
    fontFile("ArchivoExpanded-ExtraBold.ttf"),
    fontFile("ArchivoExpanded-Black.ttf"),
  ]);
  return [
    { name: ARCHIVO, data: regular, weight: 400 as const, style: "normal" as const },
    { name: ARCHIVO, data: semibold, weight: 600 as const, style: "normal" as const },
    { name: ARCHIVO_EXPANDED, data: bold, weight: 700 as const, style: "normal" as const },
    { name: ARCHIVO_EXPANDED, data: extrabold, weight: 800 as const, style: "normal" as const },
    { name: ARCHIVO_EXPANDED, data: black, weight: 900 as const, style: "normal" as const },
  ];
}
export function ogFonts() {
  fonts ??= loadFonts();
  return fonts;
}

/** Colours of the storefront theme (globals.css), for images, which can't read CSS variables. */
export const OG = {
  accent: "#C8102E",
  black: "#111111",
  outline: "#3A3A38", // outlined background lettering
  line: "#D9D9D6", // text on black
  meta: "#5E5E5E",
  struck: "#8A8A86", // former price on black
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
 * `cutOut`: for an SVG illustration from /public, drop its full-size background rectangle (the garment stands free)
 * and, when `outline` is given, trace its shapes in that colour so a black garment still shows on black.
 */
export async function imageSrc(
  src: string | null | undefined,
  cutOut?: { outline?: string },
): Promise<string | null> {
  if (!src) return null;
  if (/^https?:\/\//.test(src)) return src;
  const path = normalize(src.split("?")[0]);
  const type = TYPES[extname(path).toLowerCase()];
  if (!type || !path.startsWith("/") || path.includes("..")) return null;
  try {
    let data = await readFile(join(process.cwd(), "public", path));
    if (cutOut && type === "image/svg+xml") data = Buffer.from(cutOutSvg(data.toString("utf8"), cutOut.outline));
    return `data:${type};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

/** The SVG without the rectangle that fills its whole viewBox; its content traced in `outline`, if given. */
export function cutOutSvg(svg: string, outline?: string): string {
  const [, , , w, h] = svg.match(/viewBox="([\d.-]+) ([\d.-]+) ([\d.]+) ([\d.]+)"/) ?? [];
  let out = w ? svg.replace(new RegExp(`<rect width="${w}" height="${h}"[^>]*/>`), "") : svg;
  if (outline) {
    out = out
      .replace(/(<svg[^>]*>)/, `$1<g stroke="${outline}" stroke-width="3" stroke-linejoin="round">`)
      .replace(/<\/svg>\s*$/, "</g></svg>");
  }
  return out;
}
