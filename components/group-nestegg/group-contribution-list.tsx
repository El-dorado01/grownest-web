// components/group-nestegg/group-contribution-list.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { groupNestEggApi } from "@/lib/group-nestegg-api"
import { format } from "date-fns"
import type { GroupContribution } from "@/types/group-nestegg"

import useSWR from "swr"

interface GroupContributionListProps {
  groupId: string
  formatCurrency: (n: number) => string
  refreshKey?: number
}

export function GroupContributionList({ groupId, formatCurrency, refreshKey }: GroupContributionListProps) {
  const [extraContributions, setExtraContributions] = useState<GroupContribution[]>([])
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const { data: res, isLoading, mutate } = useSWR(
    groupId ? ["group-contributions", groupId, refreshKey] : null,
    () => groupNestEggApi.contributions(groupId, 1, 20),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      onSuccess: (data) => {
        setHasNext(data.data?.pagination.hasNext ?? false)
        setExtraContributions([])
        setPage(1)
      }
    }
  )

  const firstPage = res?.data?.contributions ?? []
  const contributions = [...firstPage, ...extraContributions]

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasNext) return
    setIsLoadingMore(true)
    try {
      const nextPage = page + 1
      const { data } = await groupNestEggApi.contributions(groupId, nextPage, 20)
      if (data) {
        setExtraContributions((prev) => [...prev, ...data.contributions])
        setHasNext(data.pagination.hasNext)
        setPage(nextPage)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [groupId, page, hasNext, isLoadingMore])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    )
  }

  if (contributions.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No contributions yet.</p>
  }

  return (
    <div className="flex flex-col gap-1">
      {contributions.map((c) => {
        const initials = (c.contributor.fullName ?? "?")
          .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
        return (
          <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0 overflow-hidden">
              {c.contributor.profilePhoto ? (
                <img src={c.contributor.profilePhoto} alt={c.contributor.fullName} className="w-full h-full object-cover" />
              ) : initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.contributor.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(c.timestamp), "MMM d, yyyy · h:mm a")}
              </p>
            </div>
            <span className="text-sm font-semibold tabular-nums shrink-0">
              +{formatCurrency(c.amount)}
            </span>
          </div>
        )
      })}
      {hasNext && (
        <Button variant="ghost" size="sm" className="mt-2 self-center" onClick={loadMore} disabled={isLoadingMore}>
          {isLoadingMore ? "Loading..." : "Load more"}
        </Button>
      )}
    </div>
  )
}
