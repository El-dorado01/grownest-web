"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Activity, CheckCircle2, Package, Star, Receipt } from "lucide-react";
import type { SellerStore, SellerOrder } from "@/types/seller";

export function KpiRow({
  store, orders, ordersLoading,
}: { store: SellerStore; orders: SellerOrder[]; ordersLoading: boolean }) {
  const total = orders.length;
  const completed = orders.filter((o) => o.status === "accepted").length;
  const active = orders.filter((o) => o.status !== "accepted" && o.status !== "rejected").length;
  const aov = total ? Math.round(orders.reduce((s, o) => s + o.sellerAmount, 0) / total) : 0;

  const cards = [
    { icon: <ShoppingBag className="size-4" />, label: "Total orders", value: ordersLoading ? "—" : String(total) },
    { icon: <Activity className="size-4" />, label: "Active", value: ordersLoading ? "—" : String(active) },
    { icon: <CheckCircle2 className="size-4" />, label: "Completed", value: ordersLoading ? "—" : String(completed) },
    { icon: <Package className="size-4" />, label: "Products", value: String(store._count?.products ?? 0) },
    { icon: <Star className="size-4" />, label: "Rating", value: `${store.averageRating?.toFixed(1) ?? "—"}` },
    { icon: <Receipt className="size-4" />, label: "Avg order", value: ordersLoading ? "—" : `₦${aov.toLocaleString()}` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.04 }}
          className="rounded-2xl border border-border bg-card p-3"
        >
          <div className="text-primary">{c.icon}</div>
          <p className="text-xs text-muted-foreground mt-2">{c.label}</p>
          <p className="text-lg font-semibold">{c.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
