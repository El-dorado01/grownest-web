"use client"

import useSWR from "swr"
import { nestEggsApi } from "@/lib/nesteggs-api"

export function useNestEggs() {
  const {
    data: eggsRes,
    error: eggsError,
    isLoading: eggsLoading,
    mutate: mutateEggs,
  } = useSWR(
    "nesteggs-list",
    () => nestEggsApi.list(),
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 2000,
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

  const eggs = eggsRes?.data?.nestEggs || []
  const summary = summaryRes?.data || null
  const isLoading = eggsLoading || summaryLoading
  const error = !!(eggsError || eggsRes?.error || summaryError || summaryRes?.error)

  const mutate = () => Promise.all([mutateEggs(), mutateSummary()])

  return { eggs, summary, isLoading, error, mutate }
}
