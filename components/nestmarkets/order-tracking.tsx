import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrackingStatus } from "@/types/nestmarkets";

const STAGES: { key: TrackingStatus; label: string }[] = [
  { key: "received", label: "Received" },
  { key: "packaged", label: "Packaged" },
  { key: "on_the_way", label: "On the way" },
  { key: "delivered", label: "Delivered" },
];

export function OrderTracking({ status }: { status: TrackingStatus }) {
  const idx = STAGES.findIndex((s) => s.key === status);
  return (
    <div className="flex flex-col gap-0 py-2 pl-2">
      {STAGES.map((s, i) => {
        const done = i <= idx;
        const active = i === idx;
        const isLast = i === STAGES.length - 1;
        return (
          <div key={s.key} className="relative flex items-start gap-4">
            {/* Vertical Line */}
            {!isLast && (
              <div className={cn("absolute left-[11px] top-7 bottom-[-8px] w-0.5 rounded-full transition-colors duration-300", i < idx ? "bg-primary" : "bg-border")} />
            )}
            
            {/* Step Circle */}
            <div className={cn("relative z-10 flex size-6 mt-1 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ring-4 ring-card", done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border", active && "animate-pulse")}>
              {done ? <Check className="size-3.5" /> : i + 1}
            </div>
            
            {/* Step Label */}
            <div className="flex flex-col pb-6">
              <span className={cn("text-sm font-semibold tracking-tight transition-colors duration-200", active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground")}>
                {s.label}
              </span>
              {active && <span className="text-xs font-medium text-muted-foreground mt-0.5">Current status</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
