// components/nesteggs/goal-card.tsx
"use client"

import Link from "next/link"
import { LockIcon, ZapIcon } from "lucide-react"
import { ProgressRing } from "./progress-ring"
import { CoverIcon } from "./cover-icon"
import type { NestEgg } from "@/types/nesteggs"

interface GoalCardProps {
  egg: NestEgg
  variant?: "light" | "dark"
  formatCurrency: (n: number) => string
}

export function GoalCard({ egg, variant = "light", formatCurrency }: GoalCardProps) {
  const isDark = variant === "dark"

  const timeLabel = egg.isMature
    ? egg.canWithdraw ? "Ready to withdraw" : "Completed"
    : `${egg.daysRemaining}d left`

  const statusBadge = egg.status !== "active" ? (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
      egg.status === "completed" ? "bg-green-500/20 text-green-600" : "bg-destructive/20 text-destructive"
    }`}>
      {egg.status}
    </span>
  ) : null

  const badges = (
    <>
      {egg.isFixed && (
        <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
          isDark ? "bg-primary/30 text-primary" : "bg-primary/15 text-primary"
        }`}>
          <LockIcon className="w-2.5 h-2.5" /> Fixed
        </span>
      )}
      {egg.isAutoSave && !egg.isFixed && (
        <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
          isDark ? "bg-blue-400/20 text-blue-300" : "bg-blue-100 text-blue-600"
        }`}>
          <ZapIcon className="w-2.5 h-2.5" /> Auto
        </span>
      )}
      {statusBadge}
    </>
  )

  return (
    <Link href={`/savings/eggs/${egg.id}`}>
      {/* Mobile: horizontal list row */}
      <div className={`sm:hidden relative rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer transition-transform active:scale-[0.98] ${
        isDark ? "bg-foreground text-background" : "bg-card text-foreground border border-border"
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? "bg-primary/20" : "bg-primary/10"}`}>
          <CoverIcon name={egg.cover} className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={`text-sm font-semibold capitalize leading-tight truncate ${isDark ? "text-background" : "text-foreground"}`}>
              {egg.title}
            </p>
            {badges}
          </div>
          <div className={`h-1.5 rounded-full w-full ${isDark ? "bg-white/20" : "bg-border"}`}>
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(egg.progress, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-primary">{formatCurrency(egg.savedAmount)}</p>
            <p className={`text-[10px] ${isDark ? "text-background/60" : "text-muted-foreground"}`}>{timeLabel}</p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-base font-bold text-primary">{egg.progress}%</p>
        </div>
      </div>

      {/* sm+: grid card */}
      <div className={`hidden sm:flex relative rounded-2xl p-4 flex-col gap-3 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] ${
        isDark ? "bg-foreground text-background" : "bg-card text-foreground border border-border"
      }`}>
        <div className="flex items-start justify-between">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDark ? "bg-primary/20" : "bg-primary/10"}`}>
            <CoverIcon name={egg.cover} className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center gap-1 flex-wrap justify-end">{badges}</div>
        </div>

        <p className={`text-sm font-semibold capitalize leading-tight line-clamp-2 ${isDark ? "text-background" : "text-foreground"}`}>
          {egg.title}
        </p>

        <div className="flex justify-center">
          <div className={isDark ? "[&_svg_circle.text-border]:text-white/20 [&_.text-foreground]:text-background [&_.text-muted-foreground]:text-background/60" : ""}>
            <ProgressRing progress={egg.progress} size={80} strokeWidth={8} />
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs font-bold text-primary">
            {formatCurrency(egg.savedAmount)}{" "}
            <span className={`font-normal text-[10px] ${isDark ? "text-background/50" : "text-muted-foreground"}`}>
              / {formatCurrency(egg.targetAmount)}
            </span>
          </p>
          <p className={`text-[10px] mt-0.5 ${isDark ? "text-background/60" : "text-muted-foreground"}`}>{timeLabel}</p>
        </div>
      </div>
    </Link>
  )
}