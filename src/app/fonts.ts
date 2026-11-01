import { Manrope, Unbounded } from "next/font/google";

/**
 * Font pair as CSS variables (--font-display, --font-sans), applied on <html> in every root layout.
 * Components only use the font-display / font-sans tokens, so a store can later pick its own pair here.
 * latin-ext: ä ö ü é è à ç; adjustFontFallback: metric-matched fallback → no layout shift on swap.
 */
const display = Unbounded({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--font-display",
});

const sans = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--font-sans",
});

export const fontVariables = `${display.variable} ${sans.variable}`;
