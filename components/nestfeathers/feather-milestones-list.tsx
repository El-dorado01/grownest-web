"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, Trophy, Lock } from "lucide-react"
import { getFeatherTheme } from "./utils"

interface FeatherMilestonesListProps {
  feather: any
}

export function FeatherMilestonesList({ feather }: FeatherMilestonesListProps) {
  const currentLevel = feather.level || 0
  const theme = getFeatherTheme(feather.type)

  const ropeGradient = "from-primary/70 via-primary/45 to-primary/15"

  return (
    <div className="relative py-2 px-2 space-y-4 overflow-hidden">
      {/* Left Rope */}
      <div className={cn("absolute left-8 sm:left-10 top-8 bottom-8 w-1.5 bg-linear-to-b rounded-full z-0 opacity-60 shadow-xs border-r border-white/10", ropeGradient)} />
      {/* Right Rope */}
      <div className={cn("absolute right-8 sm:right-10 top-8 bottom-8 w-1.5 bg-linear-to-b rounded-full z-0 opacity-60 shadow-xs border-l border-white/10", ropeGradient)} />

      {feather.milestones.map((m: any, idx: number) => {
        const isUnlocked = currentLevel >= m.level
        const isNext = !isUnlocked && (idx === 0 || currentLevel >= feather.milestones[idx - 1]?.level)
        const isEven = idx % 2 === 0

        return (
          <div 
            key={m.level} 
            className={cn(
              "flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300 relative z-10 mx-2 sm:mx-4 bg-card cursor-pointer shadow-sm hover:shadow-md",
              isEven 
                ? "rotate-2 translate-x-1 hover:rotate-0 hover:translate-x-0 hover:scale-[1.03] hover:z-20" 
                : "-rotate-2 -translate-x-1 hover:rotate-0 hover:translate-x-0 hover:scale-[1.03] hover:z-20",
              isUnlocked 
                ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-500/20 text-foreground" 
                : isNext 
                  ? "bg-amber-50 dark:bg-amber-950 border-primary/20 text-foreground" 
                  : "bg-card border-muted/30 text-muted-foreground/60"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Status Indicator Icon */}
                <div 
                  className={cn(
                    "h-8 w-8 rounded-full border flex items-center justify-center shrink-0",
                    isUnlocked && "border-emerald-500 bg-emerald-500/10 text-emerald-500 dark:bg-emerald-950/30",
                    isNext && "border-primary bg-primary/10 text-primary",
                    !isUnlocked && !isNext && "border-muted text-muted-foreground/60"
                  )}
                >
                  {isUnlocked ? (
                    <CheckCircle2 className="h-4 w-4 fill-emerald-500 text-white dark:fill-transparent" />
                  ) : isNext ? (
                    <Trophy className="h-4 w-4" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                  )}
                </div>

                <div>
                  <h4 
                    className={cn(
                      "text-xs sm:text-sm font-bold tracking-tight leading-none",
                      (isUnlocked || isNext) ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {m.label}
                  </h4>
                  <p className={cn(
                    "text-xs font-semibold mt-1.5",
                    (isUnlocked || isNext) ? "text-muted-foreground" : "text-muted-foreground/50"
                  )}>
                    Level {m.level} • Requires {m.threshold} actions
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <span 
                className={cn(
                  "text-xs font-black uppercase px-2 py-0.5 rounded-full tracking-wider shrink-0",
                  isUnlocked && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
                  isNext && "bg-primary/10 text-primary",
                  !isUnlocked && !isNext && "bg-muted text-muted-foreground"
                )}
              >
                {isUnlocked ? "Unlocked" : isNext ? "In Progress" : "Locked"}
              </span>
            </div>

            {/* Next Milestone Progress bar */}
            {isNext && (
              <div className="pt-2.5 border-t border-primary/10 mt-0.5">
                <div className="flex justify-between text-xs font-black tracking-tight text-muted-foreground mb-1.5">
                  <span>Target Progress</span>
                  <span>{feather.count} / {m.threshold} actions</span>
                </div>
                <div className="relative w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(100, (feather.count / m.threshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
