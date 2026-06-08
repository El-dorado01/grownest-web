"use client"

import useSWR from "swr"
import { nestFeathersApi } from "@/lib/nestfeathers-api"

export function useNestFeathers() {
  const { data: res, error: swrError, isLoading, mutate } = useSWR(
    "nestfeathers-list",
    () => nestFeathersApi.getFeathers(),
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 2000,
    }
  )

  const feathers = res?.data || []
  const error = swrError || res?.error

  return {
    feathers,
    isLoading,
    error: !!error,
    errorMsg: typeof error === "string" ? error : null,
    mutate
  }
}
