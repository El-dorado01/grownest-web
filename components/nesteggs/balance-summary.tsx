// components/nesteggs/balance-summary.tsx
"use client"

import { TrendingUpIcon, UsersIcon, CalendarIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { BalanceSummary } from "@/types/nesteggs"

interface BalanceSummaryProps {
  summary: BalanceSummary | null
  isLoading: boolean
  formatCurrency: (n: number) => string
}

export function BalanceSummaryCards({ summary, isLoading, formatCurrency }: BalanceSummaryProps) {
  const stats = [
    {
      label: "Total Personal Savings",
      value: summary?.personal.total ?? 0,
      icon: <TrendingUpIcon className="w-4 h-4" />,
      sub: `${summary?.personal.count ?? 0} active goal${(summary?.personal.count ?? 0) !== 1 ? "s" : ""}`,
      highlight: false,
    },
    {
      label: "Group Savings",
      value: summary?.group.total ?? 0,
      icon: <UsersIcon className="w-4 h-4" />,
      sub: `${summary?.group.count ?? 0} group${(summary?.group.count ?? 0) !== 1 ? "s" : ""}`,
      highlight: false,
    },
    {
      label: "Saved This Week",
      value: summary?.thisWeek.total ?? 0,
      icon: <CalendarIcon className="w-4 h-4" />,
      sub: summary ? `${summary.weekStart} – ${summary.weekEnd}` : "",
      highlight: true,
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-2xl p-4 flex items-start gap-3 ${
            stat.highlight
              ? "bg-primary/10 border border-primary/20"
              : "bg-card border border-border"
          }`}
        >
          <div className={`p-2 rounded-xl shrink-0 ${stat.highlight ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
            {stat.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(stat.value)}</p>
            <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
