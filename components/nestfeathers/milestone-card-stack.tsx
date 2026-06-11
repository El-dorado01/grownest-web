"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"
import { getFeatherTheme, getFeatherIcon } from "./utils"

interface MilestoneCardStackProps {
  type: string
  currentLevel: number
  milestones: any[]
}

export function MilestoneCardStack({ type, currentLevel, milestones }: MilestoneCardStackProps) {
  const theme = getFeatherTheme(type)
  const totalLevels = milestones.length

  return (
    <div className="relative w-20 h-16 shrink-0 select-none mx-auto sm:mx-0 sm:mr-4">
      {/* 3rd Card (Furthest Back) */}
      {totalLevels > 2 && (
        <div 
          className={cn(
            "absolute inset-0 rounded-2xl border bg-card shadow-xs transition-all duration-300 origin-bottom-right rotate-12 translate-x-5 translate-y-1 scale-90 z-0",
            currentLevel >= 3 ? "border-primary/40" : "border-muted/80"
          )}
        />
      )}

      {/* 2nd Card (Middle) */}
      {totalLevels > 1 && (
        <div 
          className={cn(
            "absolute inset-0 rounded-2xl border bg-card shadow-sm transition-all duration-300 origin-bottom-right -rotate-6 translate-x-2.5 translate-y-0.5 scale-95 z-10",
            currentLevel >= 2 ? "border-primary/40" : "border-muted/80"
          )}
        />
      )}

      {/* 1st Card (Front/Top) */}
      <div 
        className={cn(
          "absolute inset-0 rounded-2xl border bg-card shadow-md flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 z-20 overflow-hidden",
          currentLevel > 0 ? "border-primary/50" : "border-muted/95"
        )}
      >
        {/* Colorful icon or lock */}
        {currentLevel > 0 ? (
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", theme.iconBg)}>
            {getFeatherIcon(type, "h-4.5 w-4.5")}
          </div>
        ) : (
          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-muted/40 text-muted-foreground/60">
            <Lock className="h-3.5 w-3.5" />
          </div>
        )}

        {/* Counter Badge (+X remaining levels) */}
        {totalLevels - currentLevel > 0 && (
          <span className="absolute bottom-1 right-1 text-[10px] font-black tracking-tighter px-0.5 rounded bg-muted text-muted-foreground">
            +{totalLevels - currentLevel}
          </span>
        )}
      </div>
    </div>
  )
}
