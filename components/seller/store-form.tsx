"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImagePicker } from "./image-picker";
import type { SellerStore } from "@/types/seller";

export interface StoreFormValue {
  name: string;
  description: string;
  businessAddress: string;
  logo: File | null;
  banner: File | null;
}

export function StoreForm({
  initial, value, onChange,
}: {
  initial?: SellerStore | null;
  value: StoreFormValue;
  onChange: (v: StoreFormValue) => void;
}) {
  const set = (patch: Partial<StoreFormValue>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <ImagePicker label="Logo" initialUrl={initial?.logoUrl} onChange={(f) => set({ logo: f })} aspect="square" />
        <ImagePicker label="Banner" initialUrl={initial?.bannerUrl} onChange={(f) => set({ banner: f })} aspect="banner" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Store name</label>
        <Input value={value.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Mama's Kitchen" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <Textarea value={value.description} onChange={(e) => set({ description: e.target.value })} placeholder="What does your store sell?" maxLength={500} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Business address <span className="text-muted-foreground">(optional now, required for verification)</span></label>
        <Input value={value.businessAddress} onChange={(e) => set({ businessAddress: e.target.value })} placeholder="Street, city, state" />
      </div>
    </div>
  );
}

export function emptyStoreForm(initial?: SellerStore | null): StoreFormValue {
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    businessAddress: initial?.businessAddress ?? "",
    logo: null,
    banner: null,
  };
}

export function storeFormToFormData(v: StoreFormValue, includePin?: string): FormData {
  const fd = new FormData();
  fd.append("name", v.name);
  if (v.description) fd.append("description", v.description);
  if (v.businessAddress) fd.append("businessAddress", v.businessAddress);
  if (v.logo) fd.append("logo", v.logo);
  if (v.banner) fd.append("banner", v.banner);
  if (includePin) fd.append("pin", includePin);
  return fd;
}
