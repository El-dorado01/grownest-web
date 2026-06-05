"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Store, CheckCircle2, Zap, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreateStoreLanding() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-xl mx-auto text-center py-16 md:py-24"
    >
      <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
        <Store className="size-8" />
      </div>
      <h1 className="text-2xl font-bold">Start selling on NestMarket</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Turn your GrowNest audience into customers. List products, manage orders, and get paid directly into your NestPurse.
      </p>
      <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-left space-y-3">
        {[
          { icon: <CheckCircle2 className="size-4 text-primary" />, text: "Reach thousands of local buyers" },
          { icon: <Zap className="size-4 text-primary" />, text: "Instant payouts to your NestPurse wallet" },
          { icon: <Boxes className="size-4 text-primary" />, text: "Easy order & inventory management" },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">{f.icon}<span>{f.text}</span></div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        One-time setup fee: <span className="font-semibold text-foreground">₦1,000</span> (deducted from NestPurse)
      </div>
      <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
        <Link href="/seller/store">Create your store now</Link>
      </Button>
    </motion.div>
  );
}
