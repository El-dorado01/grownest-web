"use client"

import useSWR from "swr"
import { authApi } from "@/lib/auth-api"

export function useProfile(enabled: boolean = true) {
  const { data: res, error: swrError, isLoading, mutate } = useSWR(
    enabled ? "user-profile" : null,
    () => authApi.getProfile(),
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 2000,
    }
  )

  const profile = res?.data?.profile
  const balance = res?.data?.balance || 0
  const recentActivity = res?.data?.recentActivity || []
  const error = swrError || res?.error

  return {
    profile,
    balance,
    recentActivity,
    isLoading,
    error: !!error,
    errorMsg: typeof error === "string" ? error : null,
    mutate
  }
}
