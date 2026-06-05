"use client";

import { motion } from "framer-motion";
import { PackagePlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SellerProductCard } from "./seller-product-card";
import type { SellerProduct } from "@/types/seller";

export function SellerProductGrid({
  products, isLoading, onAdd, onEdit, onDelete,
}: {
  products: SellerProduct[]; isLoading: boolean;
  onAdd: () => void; onEdit: (p: SellerProduct) => void; onDelete: (p: SellerProduct) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center"
      >
        <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-muted">
          <PackagePlus className="size-6 text-muted-foreground" />
        </div>
        <p className="font-medium">No products yet</p>
        <p className="text-sm text-muted-foreground mb-4">Add your first product to start selling.</p>
        <Button onClick={onAdd}>Add product</Button>
      </motion.div>
    );
  }
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b border-border bg-muted/30">
              <tr className="border-b transition-colors">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Stock</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[80px]"></th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0 border-border">
              {products.map((p) => (
                <tr key={p.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-md bg-muted overflow-hidden shrink-0 relative">
                        {p.imageUrl && <img src={p.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                      </div>
                      <span className="font-medium text-foreground">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle text-muted-foreground">{p.category || "—"}</td>
                  <td className="p-4 align-middle font-medium text-foreground">₦{p.price.toLocaleString()}</td>
                  <td className="p-4 align-middle text-muted-foreground">{p.stockLevel} in stock</td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${p.stockLevel > 0 ? "bg-primary/10 text-primary border border-primary/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
                      {p.stockLevel > 0 ? "Active" : "Out of stock"}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => onEdit(p)}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(p)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Mobile Grid View */}
      <div className="grid md:hidden grid-cols-2 sm:grid-cols-3 gap-4">
        {products.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.03 }}
          >
            <SellerProductCard product={p} onEdit={() => onEdit(p)} onDelete={() => onDelete(p)} />
          </motion.div>
        ))}
      </div>
    </>
  );
}
