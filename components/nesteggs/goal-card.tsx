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

  const statusBadge = egg.status !== "active" ? (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
      egg.status === "completed"
        ? "bg-green-500/20 text-green-600"
        : "bg-destructive/20 text-destructive"
    }`}>
      {egg.status}
    </span>
  ) : null

  return (
    <Link href={`/savings/eggs/${egg.id}`}>
      <div
        className={`relative rounded-2xl p-5 flex flex-col gap-4 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] ${
          isDark
            ? "bg-foreground text-background"
            : "bg-card text-foreground border border-border"
        }`}
      >
        {/* Top row: cover icon + badges */}
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDark ? "bg-primary/20" : "bg-primary/10"
          }`}>
            <CoverIcon name={egg.cover} className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {egg.isFixed && (
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isDark ? "bg-primary/30 text-primary" : "bg-primary/15 text-primary"
              }`}>
                <LockIcon className="w-2.5 h-2.5" /> Fixed
              </span>
            )}
            {egg.isAutoSave && !egg.isFixed && (
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isDark ? "bg-blue-400/20 text-blue-300" : "bg-blue-100 text-blue-600"
              }`}>
                <ZapIcon className="w-2.5 h-2.5" /> Auto
              </span>
            )}
            {statusBadge}
          </div>
        </div>

        {/* Title */}
        <p className={`text-sm font-semibold capitalize leading-tight line-clamp-2 ${isDark ? "text-background" : "text-foreground"}`}>
          {egg.title}
        </p>

        {/* Progress ring */}
        <div className="flex justify-center">
          <div className={isDark ? "[&_svg_circle.text-border]:text-white/20 [&_.text-foreground]:text-background [&_.text-muted-foreground]:text-background/60" : ""}>
            <ProgressRing progress={egg.progress} size={96} strokeWidth={9} />
          </div>
        </div>

        {/* Amounts */}
        <div className="text-center">
          <p className="text-sm font-bold text-primary">
            {formatCurrency(egg.savedAmount)}{" "}
            <span className={`font-normal text-xs ${isDark ? "text-background/50" : "text-muted-foreground"}`}>
              / {formatCurrency(egg.targetAmount)}
            </span>
          </p>
          <p className={`text-xs mt-0.5 ${isDark ? "text-background/60" : "text-muted-foreground"}`}>
            {egg.isMature
              ? egg.canWithdraw
                ? "Ready to withdraw"
                : "Completed"
              : `${egg.daysRemaining} day${egg.daysRemaining !== 1 ? "s" : ""} left`
            }
          </p>
        </div>
      </div>
    </Link>
  )
}
