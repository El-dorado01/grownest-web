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

const cards = [
  {
    label: "Total Personal Savings",
    icon: <TrendingUpIcon className="w-4 h-4" />,
    highlight: false,
  },
  {
    label: "Group Savings",
    icon: <UsersIcon className="w-4 h-4" />,
    highlight: false,
  },
  {
    label: "Saved This Week",
    icon: <CalendarIcon className="w-4 h-4" />,
    highlight: true,
  },
]

export function BalanceSummaryCards({ summary, isLoading, formatCurrency }: BalanceSummaryProps) {
  const values = [
    {
      value: summary?.personal.total ?? 0,
      sub: `${summary?.personal.count ?? 0} active goal${(summary?.personal.count ?? 0) !== 1 ? "s" : ""}`,
    },
    {
      value: summary?.group.total ?? 0,
      sub: `${summary?.group.count ?? 0} group${(summary?.group.count ?? 0) !== 1 ? "s" : ""}`,
    },
    {
      value: summary?.thisWeek.total ?? 0,
      sub: summary ? `${summary.weekStart} – ${summary.weekEnd}` : "This week",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`rounded-2xl p-4 flex items-start gap-3 ${
            card.highlight
              ? "bg-primary/10 border border-primary/20"
              : "bg-card border border-border"
          }`}
        >
          <div className={`p-2 rounded-xl shrink-0 ${card.highlight ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
            {card.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{card.label}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-32 mt-1 mb-1" />
            ) : (
              <p className="text-lg font-bold text-foreground">{formatCurrency(values[i].value)}</p>
            )}
            <p className="text-[11px] text-muted-foreground">{values[i].sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}