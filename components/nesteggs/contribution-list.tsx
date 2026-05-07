// components/nesteggs/contribution-list.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpIcon, ArrowDownIcon, ZapIcon, RotateCcwIcon } from "lucide-react"
import { nestEggsApi } from "@/lib/nesteggs-api"
import { format } from "date-fns"
import type { NestEggContribution } from "@/types/nesteggs"

interface ContributionListProps {
  nestEggId: string
  formatCurrency: (n: number) => string
  refreshKey?: number
}

const typeIcon: Record<string, React.ReactNode> = {
  manual: <ArrowUpIcon className="w-3.5 h-3.5 text-green-500" />,
  auto: <ZapIcon className="w-3.5 h-3.5 text-primary" />,
  withdrawal: <ArrowDownIcon className="w-3.5 h-3.5 text-destructive" />,
  repayment: <RotateCcwIcon className="w-3.5 h-3.5 text-blue-500" />,
}

const typeLabel: Record<string, string> = {
  manual: "Manual top-up",
  auto: "Auto-save",
  withdrawal: "Flexible withdrawal",
  repayment: "Repayment",
}

export function ContributionList({ nestEggId, formatCurrency, refreshKey }: ContributionListProps) {
  const [contributions, setContributions] = useState<NestEggContribution[]>([])
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchPage = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) setIsLoading(true)
      else setIsLoadingMore(true)

      const { data } = await nestEggsApi.contributions(nestEggId, pageNum, 20)

      if (data) {
        setContributions((prev) =>
          append ? [...prev, ...data.contributions] : data.contributions
        )
        setHasNext(data.pagination.hasNext)
        setPage(pageNum)
      }

      setIsLoading(false)
      setIsLoadingMore(false)
    },
    [nestEggId]
  )

  useEffect(() => {
    setPage(1)
    setContributions([])
    fetchPage(1, false)
  }, [nestEggId, refreshKey, fetchPage])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
    )
  }

  if (contributions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No contributions yet. Start saving!
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {contributions.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
            {typeIcon[c.type] ?? <ArrowUpIcon className="w-3.5 h-3.5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {typeLabel[c.type] ?? c.type}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(c.timestamp), "MMM d, yyyy · h:mm a")}
            </p>
          </div>
          <span
            className={`text-sm font-semibold tabular-nums shrink-0 ${
              c.amount < 0 ? "text-destructive" : "text-foreground"
            }`}
          >
            {c.amount < 0 ? "−" : "+"}
            {formatCurrency(Math.abs(c.amount))}
          </span>
        </div>
      ))}
      {hasNext && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 self-center"
          onClick={() => fetchPage(page + 1, true)}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? "Loading..." : "Load more"}
        </Button>
      )}
    </div>
  )
}
