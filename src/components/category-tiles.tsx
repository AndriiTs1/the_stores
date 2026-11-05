import Image from "next/image";
import Link from "next/link";

export type Tile = {
  href: string;
  label: string;
  /** Tile background (#RRGGBB); the surface grey when unset. */
  color: string | null;
  /** The tile picture from the settings: drawn over the whole tile. */
  image: string | null;
  /** Without a picture: a product illustration (cut out) standing on the colour. */
  silhouette: string | null;
};

/**
 * Category tiles at the top of the home page, then "Sale" (red, a white %) when something is reduced.
 * Phones: one row that scrolls sideways and snaps, 92×112 tiles with the name under them; the next tile peeks in at
 * the edge. From md: one row of up to 6 equal columns (more wrap), 220px high, the name on the tile, bottom left,
 * in Archivo Expanded Black. Each tile is one link named by its label.
 */
export function CategoryTiles({ tiles, sale, label }: { tiles: Tile[]; sale: { href: string; label: string } | null; label: string }) {
  const count = tiles.length + (sale ? 1 : 0);
  if (count === 0) return null;
  return (
    <nav aria-label={label} className="-mx-4 mb-6 sm:-mx-6 md:mx-0 md:mb-10">
      <ul
        className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:scroll-px-6 sm:px-6 md:grid md:gap-4 md:overflow-visible md:px-0 md:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
        style={{ "--cols": Math.min(count, 6) } as React.CSSProperties}
      >
        {tiles.map((t) => (
          <li key={t.href} className="w-[92px] shrink-0 snap-start md:w-auto">
            <Link href={t.href} className="group block rounded-xl md:rounded-[14px]">
              <span
                className="relative flex h-28 items-center justify-center overflow-hidden rounded-xl bg-surface md:h-[220px] md:rounded-[14px]"
                style={t.color ? { backgroundColor: t.color } : undefined}
              >
                {t.image ? (
                  <Image src={t.image} alt="" fill sizes="(min-width: 768px) 17vw, 92px" className="object-cover" />
                ) : (
                  t.silhouette && (
                    // A data URI or a photo URL from the catalogue: a plain img (next/image can't optimise data URIs).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.silhouette}
                      alt=""
                      className="h-[82%] w-auto object-contain transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none md:absolute md:right-[6%] md:top-[8%] md:h-[78%]"
                    />
                  )
                )}
                <TileName>{t.label}</TileName>
              </span>
              <span className="mt-1.5 block truncate text-center text-[13px] font-medium md:hidden">{t.label}</span>
            </Link>
          </li>
        ))}
        {sale && (
          <li className="w-[92px] shrink-0 snap-start md:w-auto">
            <Link href={sale.href} className="group block rounded-xl md:rounded-[14px]">
              <span className="relative flex h-28 items-center justify-center overflow-hidden rounded-xl bg-accent text-accent-ink md:h-[220px] md:rounded-[14px]">
                <span aria-hidden className="font-display text-5xl font-bold md:absolute md:right-[10%] md:top-[12%] md:text-8xl">
                  %
                </span>
                <TileName>{sale.label}</TileName>
              </span>
              <span className="mt-1.5 block truncate text-center text-[13px] font-semibold text-accent md:hidden">
                {sale.label}
              </span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

/** The name on a desktop tile: bottom left, Archivo Expanded Black 22px, two lines at most. */
function TileName({ children }: { children: string }) {
  return (
    <span className="absolute inset-x-5 bottom-4 hidden font-tile text-[22px] font-black leading-[1.05] [font-stretch:125%] md:line-clamp-2 md:hyphens-auto md:break-words">
      {children}
    </span>
  );
}
