/**
 * Text that takes the room of its longest translation, so switching the language changes the words but not the size
 * of the frame around them (no neighbour moves). All `variants` sit in one grid cell, always in the same order; only
 * `text` is visible, the others are invisible (hidden from screen readers and find-in-page too).
 * `block`: fills the line (a card title, which may wrap); else inline, centred (a button or link label).
 */
export function StableText({
  text,
  variants,
  block = false,
  className = "",
}: {
  text: string;
  variants: readonly string[];
  block?: boolean;
  className?: string;
}) {
  // Same order in every language: a switch only changes which one is visible, the elements stay put.
  const all = [...new Set([...variants, text])].filter(Boolean);
  if (all.length < 2) return className ? <span className={className}>{text}</span> : <>{text}</>;
  return (
    <span className={`${block ? "grid" : "inline-grid justify-items-center"} ${className}`}>
      {all.map((v) => (
        <span key={v} aria-hidden={v === text ? undefined : true} className={`[grid-area:1/1] ${v === text ? "" : "invisible"}`}>
          {v}
        </span>
      ))}
    </span>
  );
}
