"use client"

import useSWR from "swr"
import { nestCircleApi, type NestCircleData } from "@/lib/nestcircle-api"

export function useNestCircle() {
  const { data: res, error: swrError, isLoading, mutate } = useSWR<{ data: NestCircleData | null; error: string | null }>(
    "nestcircle-data",
    () => nestCircleApi.getCircle(),
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 3000,
    }
  )

  const circleData = res?.data ?? null
  const error = swrError || res?.error

  return {
    circleData,
    isLoading,
    error: !!error,
    errorMsg: typeof error === "string" ? error : null,
    mutate,
  }
}
