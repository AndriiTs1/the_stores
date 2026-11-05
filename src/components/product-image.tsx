import Image from "next/image";

/**
 * Product photo in a 3:4 frame (next/image, sized by `sizes`), or a neutral placeholder with initials.
 * `hoverSrc`: a second photo that fades in while the pointer is over the surrounding `group` (hover devices only).
 */
export function ProductImage({
  src,
  hoverSrc,
  title,
  sizes,
  preload = false,
  className = "",
}: {
  src?: string;
  hoverSrc?: string;
  title: string;
  /** Rendered width at each breakpoint, e.g. "(min-width: 1024px) 25vw, 50vw". */
  sizes: string;
  /** Only for the largest image above the fold (LCP). */
  preload?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-surface ${className}`}>
      {src ? (
        <Image src={src} alt={title} fill sizes={sizes} preload={preload} className="object-cover" />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center text-4xl font-black tracking-tight text-line"
        >
          {initials(title)}
        </span>
      )}
      {src && hoverSrc && (
        <Image
          src={hoverSrc}
          alt=""
          fill
          sizes={sizes}
          className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
        />
      )}
    </div>
  );
}

function initials(title: string) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
