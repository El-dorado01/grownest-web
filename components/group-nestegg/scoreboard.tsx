// components/group-nestegg/scoreboard.tsx
"use client"

import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { WeeklyScoreboard, ScoreboardEntry } from "@/types/group-nestegg"

const MEDAL: Record<string, string> = { gold: "🥇", silver: "🥈", bronze: "🥉" }

interface ScoreboardProps {
  data: WeeklyScoreboard | null
  isLoading: boolean
  formatCurrency: (n: number) => string
}

function EntryRow({ entry, formatCurrency }: { entry: ScoreboardEntry; formatCurrency: (n: number) => string }) {
  const initials = (entry.fullName ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Rank */}
      <div className="w-7 text-center shrink-0">
        {entry.medal ? (
          <span className="text-lg">{MEDAL[entry.medal]}</span>
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">{entry.rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0 overflow-hidden">
        {entry.profilePhoto ? (
          <img src={entry.profilePhoto} alt={entry.fullName ?? ""} className="w-9 h-9 rounded-full object-cover" />
        ) : initials}
      </div>

      {/* Name + change */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.fullName}</p>
        <div className="flex items-center gap-1 text-xs">
          {entry.isNew ? (
            <span className="text-primary font-medium">New this week</span>
          ) : entry.changePercent !== null ? (
            <>
              {entry.isUp ? (
                <TrendingUpIcon className="w-3 h-3 text-green-500" />
              ) : entry.isDown ? (
                <TrendingDownIcon className="w-3 h-3 text-destructive" />
              ) : (
                <MinusIcon className="w-3 h-3 text-muted-foreground" />
              )}
              <span className={entry.isUp ? "text-green-600" : entry.isDown ? "text-destructive" : "text-muted-foreground"}>
                {entry.isUp ? "+" : ""}{entry.changePercent}%
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </div>

      {/* Amount */}
      <p className="text-sm font-bold tabular-nums shrink-0">{formatCurrency(entry.thisWeekAmount)}</p>
    </div>
  )
}

export function Scoreboard({ data, isLoading, formatCurrency }: ScoreboardProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    )
  }

  if (!data || data.scoreboard.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        No contributions this week yet. Be the first!
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Banner */}
      <div className="bg-primary rounded-2xl px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-primary-foreground font-bold text-sm">This Week&apos;s Champions</p>
          <p className="text-primary-foreground/70 text-xs">
            {new Date(data.weekStart).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
            {" – "}
            {new Date(data.weekEnd).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
          </p>
        </div>
        <p className="text-primary-foreground font-bold text-lg">
          {formatCurrency(data.totalContributedThisWeek)}
        </p>
      </div>

      {/* Leaderboard */}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        {data.scoreboard.map((entry) => (
          <EntryRow key={entry.memberId} entry={entry} formatCurrency={formatCurrency} />
        ))}
      </div>
    </div>
  )
}
