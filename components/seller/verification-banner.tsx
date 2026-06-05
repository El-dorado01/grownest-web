"use client";

import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import type { SellerStore } from "@/types/seller";

export function VerificationBanner({ store, onReview }: { store: SellerStore; onReview: () => void }) {
  if (store.isVerified && store.status === "active") return null;
  const pending = !!store.verificationRequestedAt;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-muted px-4 py-3 flex items-center gap-3"
    >
      <ShieldAlert className="size-5 text-primary shrink-0" />
      <p className="text-sm text-muted-foreground flex-1">
        {pending
          ? "Your store is pending verification. Products stay hidden from buyers until it's approved."
          : "Verify your store to make your products visible in the marketplace."}
      </p>
      <button onClick={onReview} className="text-sm font-medium text-primary shrink-0">
        {pending ? "View" : "Verify now"}
      </button>
    </motion.div>
  );
}
