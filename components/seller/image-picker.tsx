"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImagePicker({
  label, initialUrl, onChange, aspect = "square", className,
}: {
  label?: string;
  initialUrl?: string | null;
  onChange: (file: File | null) => void;
  aspect?: "square" | "banner";
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);

  const pick = (file: File | null) => {
    onChange(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-1.5">
      {label ? <label className="text-sm font-medium">{label}</label> : null}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative w-full overflow-hidden border border-dashed border-border bg-muted flex items-center justify-center transition-colors hover:border-primary/50",
          aspect === "square" ? "aspect-square rounded-xl" : "aspect-[16/6] rounded-2xl",
          className
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-all text-xs gap-1">
              <ImagePlus className="size-4" /> Change
            </span>
          </>
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
