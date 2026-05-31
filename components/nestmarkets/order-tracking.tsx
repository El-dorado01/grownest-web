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
    <div className="flex items-center">
      {STAGES.map((s, i) => {
        const done = i <= idx;
        return (
          <div key={s.key} className="flex-1 flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn("size-7 rounded-full flex items-center justify-center text-xs", done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {done ? <Check className="size-4" /> : i + 1}
              </div>
              <span className={cn("mt-1 text-[10px]", done ? "text-primary" : "text-muted-foreground")}>{s.label}</span>
            </div>
            {i < STAGES.length - 1 && <div className={cn("h-0.5 flex-1 mx-1", i < idx ? "bg-primary" : "bg-muted")} />}
          </div>
        );
      })}
    </div>
  );
}
