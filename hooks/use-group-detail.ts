"use client"

import useSWR from "swr"
import { groupNestEggApi } from "@/lib/group-nestegg-api"
import type { GroupNestEgg } from "@/types/group-nestegg"

export function useGroupDetail(id: string) {
  const { data: res, error: swrError, isLoading, mutate } = useSWR(
    id ? ["group-detail", id] : null,
    () => groupNestEggApi.get(id),
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 2000,
    }
  )

  const group = res?.data?.group || null
  const error = !!(swrError || res?.error)

  const updateGroup = (updates: Partial<GroupNestEgg>) => {
    mutate(
      (current) =>
        current?.data?.group
          ? { ...current, data: { ...current.data, group: { ...current.data.group, ...updates } } }
          : current,
      { revalidate: false }
    )
  }

  return { group, isLoading, error, mutate, updateGroup }
}
