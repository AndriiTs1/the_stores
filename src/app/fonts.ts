import { Archivo, Manrope, Unbounded } from "next/font/google";

/**
 * Font pair as CSS variables (--font-display, --font-sans), applied on <html> in every root layout.
 * Components only use the font-display / font-sans tokens, so a store can later pick its own pair here.
 * latin-ext: ä ö ü é è à ç; adjustFontFallback: metric-matched fallback → no layout shift on swap.
 */
const display = Unbounded({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  preload: true, // both subsets: accented letters (é, ü, à) never arrive later in a fallback font
  adjustFontFallback: true,
  variable: "--font-display",
});

const sans = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true, // both subsets: accented letters (é, ü, à) never arrive later in a fallback font
  adjustFontFallback: true,
  variable: "--font-sans",
});

/**
 * Archivo with its width axis, for the home page category tiles: Black at font-stretch 125% (Archivo Expanded),
 * the face of the link previews. Not preloaded: only the desktop tiles use it, and they show text at once (swap).
 */
const tile = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
  preload: false,
  variable: "--font-tile",
});

export const fontVariables = `${display.variable} ${sans.variable} ${tile.variable}`;
