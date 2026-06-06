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
    <div className="flex items-start">
      {STAGES.map((s, i) => {
        const done = i <= idx;
        const active = i === idx;
        const isLast = i === STAGES.length - 1;
        return (
          <div key={s.key} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              {/* left connector */}
              <div className={cn("h-0.5 flex-1 rounded-full transition-colors", i === 0 ? "bg-transparent" : i <= idx ? "bg-primary" : "bg-border")} />
              {/* node */}
              <div className={cn("relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all", done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border", active && "animate-pulse")}>
                {done ? <Check className="size-3.5" /> : i + 1}
              </div>
              {/* right connector */}
              <div className={cn("h-0.5 flex-1 rounded-full transition-colors", isLast ? "bg-transparent" : i < idx ? "bg-primary" : "bg-border")} />
            </div>
            <span className={cn("mt-1.5 text-[10px] leading-tight transition-colors", active ? "text-primary font-medium" : done ? "text-foreground" : "text-muted-foreground")}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}