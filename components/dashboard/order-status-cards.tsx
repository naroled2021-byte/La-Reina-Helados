import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/constants";

export function OrderStatusCards({
  counts,
}: {
  counts: { RECEIVED: number; PREPARING: number; READY: number; DELIVERED: number };
}) {
  const items = [
    { key: "RECEIVED", value: counts.RECEIVED },
    { key: "PREPARING", value: counts.PREPARING },
    { key: "READY", value: counts.READY },
    { key: "DELIVERED", value: counts.DELIVERED },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.key}
          className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3"
        >
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: ORDER_STATUS_COLOR[item.key] }}
          />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xl font-semibold tabular-nums">{item.value}</span>
            <span className="text-xs text-muted-foreground truncate">
              {ORDER_STATUS_LABEL[item.key]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
