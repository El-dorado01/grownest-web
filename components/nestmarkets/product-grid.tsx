"use client";

import { SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./product-card";
import type { MarketProduct } from "@/types/nestmarkets";

export function ProductGrid({
  products, isLoading, page, pages, onPage, onSelect,
}: {
  products: MarketProduct[]; isLoading: boolean; page: number; pages: number;
  onPage: (p: number) => void; onSelect: (p: MarketProduct) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-border">
            <Skeleton className="aspect-square w-full" />
            <div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/3" /></div>
          </div>
        ))}
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <SearchX className="size-10 text-muted-foreground mb-3" />
        <p className="font-medium">No products found</p>
        <p className="text-sm text-muted-foreground">Try a different search or category.</p>
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
        {products.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.04 }}
            className="h-full"
          >
            <ProductCard product={p} onClick={() => onSelect(p)} />
          </motion.div>
        ))}
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="size-4" /></Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
          <Button variant="outline" size="icon" disabled={page >= pages} onClick={() => onPage(page + 1)}><ChevronRight className="size-4" /></Button>
        </div>
      )}
    </>
  );
}
