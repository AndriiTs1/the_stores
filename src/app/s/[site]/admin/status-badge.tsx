const STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-green-100 text-green-800",
  FULFILLED: "bg-sky-100 text-sky-800",
  CANCELLED: "bg-neutral-200 text-neutral-600",
  REFUNDED: "bg-violet-100 text-violet-800",
  ACTIVE: "bg-green-100 text-green-800",
  DRAFT: "bg-amber-100 text-amber-800",
  ARCHIVED: "bg-neutral-200 text-neutral-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STYLES[status] ?? "bg-surface"}`}>{status}</span>
  );
}
