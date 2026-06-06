"use client";

import { useState } from "react";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImagePicker } from "./image-picker";
import { sellerApi } from "@/lib/seller-api";
import { SELLER_PRODUCTS_KEY } from "@/hooks/use-my-products";
import type { SellerProduct } from "@/types/seller";

export function ProductFormSheet({
  open, onOpenChange, product,
}: { open: boolean; onOpenChange: (o: boolean) => void; product?: SellerProduct | null }) {
  const editing = !!product;
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [stock, setStock] = useState(product ? String(product.stockLevel) : "0");
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (name.trim().length < 3) return toast.error("Product name must be at least 3 characters");
    if (!(Number(price) > 0)) return toast.error("Price must be greater than zero");
    const fd = new FormData();
    fd.append("name", name.trim());
    if (description) fd.append("description", description);
    fd.append("price", String(Number(price)));
    if (category) fd.append("category", category);
    fd.append("stockLevel", String(parseInt(stock || "0", 10)));
    if (image) fd.append("image", image);

    setBusy(true);
    const r = editing
      ? await sellerApi.updateProduct(product!.id, fd)
      : await sellerApi.createProduct(fd);
    setBusy(false);
    if (r.error || !r.data?.success) return toast.error(r.error || "Could not save product");
    toast.success(editing ? "Product updated" : "Product added");
    globalMutate([SELLER_PRODUCTS_KEY]);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader><SheetTitle>{editing ? "Edit product" : "Add product"}</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Product image</label>
            <div className="size-40">
              <ImagePicker initialUrl={product?.imageUrl} onChange={setImage} aspect="square" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} className="mt-1 h-11 bg-card" onChange={(e) => setName(e.target.value)} placeholder="e.g. Party Jollof Combo" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} className="mt-1 h-11 bg-card" onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Price (₦)</label>
              <Input inputMode="numeric" value={price} className="mt-1 h-11 bg-card" onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Stock</label>
              <Input inputMode="numeric" value={stock} className="mt-1 h-11 bg-card" onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} placeholder="0" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <Input value={category} className="mt-1 h-11 bg-card" onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Rice, Snacks, Drinks" />
          </div>
          <Button onClick={submit} disabled={busy} className="w-full h-11">{editing ? "Save changes" : "Add product"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
