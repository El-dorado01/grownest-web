"use client";

import { cn } from "@/lib/utils";

export type OrderTabKey = "new" | "packaged" | "on_the_way" | "delivered" | "completed" | "rejected";

export const ORDER_TABS: { key: OrderTabKey; label: string }[] = [
  { key: "new", label: "New" },
  { key: "packaged", label: "Packaged" },
  { key: "on_the_way", label: "On the way" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
];

export function OrderStatusTabs({
  active, counts, onChange,
}: { active: OrderTabKey; counts: Record<OrderTabKey, number>; onChange: (k: OrderTabKey) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {ORDER_TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            active === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
          )}
        >
          {t.label}{counts[t.key] ? ` (${counts[t.key]})` : ""}
        </button>
      ))}
    </div>
  );
}
