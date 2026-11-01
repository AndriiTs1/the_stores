/* eslint-disable @next/next/no-img-element */

/** Shows the first product image, or a neutral placeholder with the product's initials. */
export function ProductImage({ src, title, className = "" }: { src?: string; title: string; className?: string }) {
  if (src) {
    return <img src={src} alt={title} className={`aspect-[4/5] w-full rounded-lg object-cover ${className}`} />;
  }
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      aria-hidden
      className={`flex aspect-[4/5] w-full items-center justify-center rounded-lg bg-surface text-4xl font-black tracking-tight text-line ${className}`}
    >
      {initials}
    </div>
  );
}
