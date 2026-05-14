"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { nestEggsApi } from "@/lib/nesteggs-api"
import type { NestEgg } from "@/types/nesteggs"

const PAGE_SIZE = 15

export function useNestEggs() {
  const [extraEggs, setExtraEggs] = useState<NestEgg[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const {
    data: eggsRes,
    error: eggsError,
    isLoading: eggsLoading,
    mutate: mutateEggs,
  } = useSWR(
    "nesteggs-list",
    () => nestEggsApi.list(1, PAGE_SIZE),
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 2000,
      onSuccess: (res) => {
        setExtraEggs([])
        setPage(1)
        setHasMore(res?.data?.hasNext ?? false)
      },
    }
  )

  const {
    data: summaryRes,
    error: summaryError,
    isLoading: summaryLoading,
    mutate: mutateSummary,
  } = useSWR(
    "nesteggs-summary",
    () => nestEggsApi.balanceSummary(),
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 2000,
    }
  )

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    try {
      const nextPage = page + 1
      const res = await nestEggsApi.list(nextPage, PAGE_SIZE)
      if (res.data) {
        setExtraEggs((prev) => [...prev, ...res.data!.nestEggs])
        setHasMore(res.data.hasNext)
        setPage(nextPage)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [page, hasMore, isLoadingMore])

  const mutate = () => Promise.all([mutateEggs(), mutateSummary()])

  const firstPageEggs = eggsRes?.data?.nestEggs ?? []
  const eggs = [...firstPageEggs, ...extraEggs]
  const summary = summaryRes?.data || null
  const isLoading = eggsLoading || summaryLoading
  const error = !!(eggsError || eggsRes?.error || summaryError || summaryRes?.error)

  return { eggs, summary, isLoading, error, mutate, hasMore, isLoadingMore, loadMore }
}
