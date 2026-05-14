"use client"

import useSWR from "swr"
import { nestEggsApi } from "@/lib/nesteggs-api"
import type { NestEggDetailResponse } from "@/types/nesteggs"

export function useNestEggDetail(id: string) {
  const { data: res, error: swrError, isLoading, mutate } = useSWR(
    id ? ["nestegg-detail", id] : null,
    () => nestEggsApi.get(id),
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 2000,
    }
  )

  let egg = res?.data || null
  if (egg && egg.canWithdraw === undefined) {
    egg = { ...egg, canWithdraw: egg.progress >= 100 }
  }

  const error = !!(swrError || res?.error)

  const updateEgg = (updates: Partial<NestEggDetailResponse>) => {
    mutate(
      (current) =>
        current?.data ? { ...current, data: { ...current.data, ...updates } } : current,
      { revalidate: false }
    )
  }

  return { egg, isLoading, error, mutate, updateEgg }
}
