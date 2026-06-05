"use client";

import { motion } from "framer-motion";
import { Clock, Wallet } from "lucide-react";
import type { SellerStore } from "@/types/seller";

export function EarningsCards({ store }: { store: SellerStore }) {
  const pending = store.pendingBalance ?? 0;
  const earned = store.totalEarned ?? 0;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-6"
      >
        <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
          <Wallet className="size-4" /> Total earned
        </div>
        <p className="mt-4 text-3xl font-bold">₦{earned.toLocaleString()}</p>
        <p className="text-xs text-primary-foreground/70 mt-1">Paid into your NestPurse wallet</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Clock className="size-4 text-primary" /> Pending
        </div>
        <p className="mt-4 text-3xl font-bold">₦{pending.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-1">Held until buyers confirm delivery</p>
      </motion.div>
    </div>
  );
}
