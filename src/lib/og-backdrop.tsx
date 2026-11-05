import { ARCHIVO_EXPANDED, OG } from "./og";

/**
 * Background of the link previews: the store name in four rows of large outlined capitals on black, rows 2 and 4
 * shifted left; cut off by the top and left edges.
 */
export function OutlineBackdrop({ name }: { name: string }) {
  const row = `${name} ${name} ${name}`;
  return (
    <div style={{ position: "absolute", top: -40, left: -48, display: "flex", flexDirection: "column" }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            marginLeft: i % 2 ? -260 : 0,
            fontFamily: ARCHIVO_EXPANDED,
            fontWeight: 900,
            fontSize: 150,
            lineHeight: 0.9,
            whiteSpace: "nowrap",
            // Outline only, 1.5px. The next/og renderer skips text with a transparent fill and ignores the
            // shorthand, so: filled with the background colour, a 3px stroke painted under the fill (half shows).
            color: OG.black,
            WebkitTextStrokeWidth: 3,
            WebkitTextStrokeColor: OG.outline,
          }}
        >
          {row}
        </div>
      ))}
    </div>
  );
}

/**
 * A red band across the image, tilted. Its phrases repeat with a white dot between them (drawn: Archivo has no ●)
 * until they run off the edge; `once`: a short band with its one phrase centred (a product's −X%).
 */
export function Ribbon({
  phrases,
  top,
  left = -120,
  width = 1440,
  angle = -5,
  fontSize = 30,
  height = 76,
  once = false,
}: {
  phrases: string[];
  top: number;
  left?: number;
  width?: number;
  angle?: number;
  fontSize?: number;
  height?: number;
  once?: boolean;
}) {
  const items = once ? phrases : Array.from({ length: Math.ceil(12 / phrases.length) }, () => phrases).flat();
  const dot = Math.round(fontSize * 0.4);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: once ? "center" : "flex-start",
        overflow: "hidden",
        background: OG.accent,
        transform: `rotate(${angle}deg)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingLeft: once ? 0 : Math.max(0, -left) + 40, // the first phrase starts whole, just inside the image
          fontFamily: ARCHIVO_EXPANDED,
          fontWeight: 800,
          fontSize,
          letterSpacing: 1,
          whiteSpace: "nowrap",
          color: OG.white,
        }}
      >
        {items.map((phrase, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {phrase}
            {!once && <div style={{ width: dot, height: dot, margin: `0 ${fontSize * 0.8}px`, borderRadius: dot, background: OG.white }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
