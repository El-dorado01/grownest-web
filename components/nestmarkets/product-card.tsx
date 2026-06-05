"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";
import type { MarketProduct } from "@/types/nestmarkets";

export function ProductCard({ product, onClick }: { product: MarketProduct; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="flex h-full w-full flex-col text-left rounded-2xl bg-card border border-border overflow-hidden transition-shadow hover:shadow-lg hover:border-primary/40"
    >
      <div className="relative aspect-square bg-muted">
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute bottom-2 left-2 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1 flex gap-1 items-center text-[10px] font-medium">
          {product.store.logoUrl && (
            <img src={product.store.logoUrl} alt="" className="size-3.5 rounded-full object-cover" />
          )}
          <span className="max-w-[80px] truncate">{product.store.name}</span>
          <Star className="size-3 fill-primary text-primary" />
          <span>{product.store.averageRating?.toFixed(1) ?? "—"}</span>
        </div>
      </div>
      <div className="p-3 flex flex-1 flex-col">
        <p className="text-sm font-medium line-clamp-2">{product.name}</p>
        <p className="mt-auto pt-1 text-base font-semibold text-primary">₦{product.price.toLocaleString()}</p>
      </div>
    </motion.button>
  );
}
