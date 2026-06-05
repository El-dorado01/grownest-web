"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import type { SellerStore } from "@/types/seller";

export function DashboardHero({ store }: { store: SellerStore }) {
  const pending = store.pendingBalance ?? 0;
  const earned = store.totalEarned ?? 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-6 md:p-8"
    >
      <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
        <TrendingUp className="size-4" /> Earnings
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-primary-foreground/80">Total earned</p>
          <p className="text-3xl font-bold">₦{earned.toLocaleString()}</p>
          <p className="text-xs text-primary-foreground/70 mt-1">Paid into your NestPurse</p>
        </div>
        <div>
          <p className="text-sm text-primary-foreground/80">Pending</p>
          <p className="text-3xl font-bold">₦{pending.toLocaleString()}</p>
          <p className="text-xs text-primary-foreground/70 mt-1">Held until buyers confirm delivery</p>
        </div>
      </div>
    </motion.div>
  );
}
