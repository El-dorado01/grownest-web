"use client";

import { motion } from "framer-motion";
import type { SellerOrder } from "@/types/seller";

export function RevenueBars({ orders }: { orders: SellerOrder[] }) {
  // Bucket sellerAmount by day for the last 7 days.
  const days: { label: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    const total = orders
      .filter((o) => o.createdAt.slice(0, 10) === key)
      .reduce((s, o) => s + o.sellerAmount, 0);
    days.push({ label, total });
  }
  const max = Math.max(1, ...days.map((d) => d.total));
  const hasData = days.some((d) => d.total > 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Revenue · last 7 days</h2>
      </div>
      {!hasData ? (
        <div className="h-40 flex flex-col items-center justify-center text-center">
          <div className="w-full border-t border-dashed border-border mb-3" />
          <p className="text-sm text-muted-foreground">Your growth story starts here</p>
        </div>
      ) : (
        <div className="flex items-end gap-2 h-40">
          {days.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex-1 flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.total / max) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="w-full rounded-t-md bg-primary min-h-[2px]"
                  title={`₦${d.total.toLocaleString()}`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
