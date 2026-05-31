"use client";

import { cn } from "@/lib/utils";

export function CategoryFilter({
  categories, active, onChange,
}: { categories: string[]; active: string; onChange: (c: string) => void }) {
  const all = ["", ...categories];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {all.map((c) => (
        <button
          key={c || "all"}
          onClick={() => onChange(c)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            active === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
          )}
        >
          {c === "" ? "All" : c}
        </button>
      ))}
    </div>
  );
}
