"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImagePicker({
  label, initialUrl, onChange, aspect = "square",
}: {
  label: string;
  initialUrl?: string | null;
  onChange: (file: File | null) => void;
  aspect?: "square" | "banner";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);

  const pick = (file: File | null) => {
    onChange(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative w-full overflow-hidden rounded-xl border border-dashed border-border bg-muted flex items-center justify-center",
          aspect === "square" ? "aspect-square max-w-40" : "aspect-[16/5]"
        )}
      >
        {preview ? (
          <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-muted-foreground text-xs">
            <ImagePlus className="size-5" /> Upload
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
