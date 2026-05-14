"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { groupNestEggApi } from "@/lib/group-nestegg-api"
import type { GroupListItem } from "@/types/group-nestegg"

const PAGE_SIZE = 15

export function useGroupNest() {
  const [extraGroups, setExtraGroups] = useState<GroupListItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const {
    data: groupsRes,
    error: groupsError,
    isLoading: groupsLoading,
    mutate: mutateGroups,
  } = useSWR(
    "group-nest-groups",
    () => groupNestEggApi.myGroups(1, PAGE_SIZE),
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 2000,
      onSuccess: (res) => {
        setExtraGroups([])
        setPage(1)
        setHasMore(res?.data?.hasNext ?? false)
      },
    }
  )

  const {
    data: invitesRes,
    error: invitesError,
    isLoading: invitesLoading,
    mutate: mutateInvites,
  } = useSWR(
    "group-nest-invitations",
    () => groupNestEggApi.myInvitations(),
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
      const res = await groupNestEggApi.myGroups(nextPage, PAGE_SIZE)
      if (res.data) {
        setExtraGroups((prev) => [...prev, ...res.data!.groups])
        setHasMore(res.data.hasNext)
        setPage(nextPage)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [page, hasMore, isLoadingMore])

  const mutate = () => Promise.all([mutateGroups(), mutateInvites()])

  const firstPageGroups = groupsRes?.data?.groups ?? []
  const groups = [...firstPageGroups, ...extraGroups]
  const pendingInvites = invitesRes?.data?.pending || []
  const isLoading = groupsLoading || invitesLoading
  const error = !!(groupsError || groupsRes?.error || invitesError || invitesRes?.error)

  return { groups, pendingInvites, isLoading, error, mutate, hasMore, isLoadingMore, loadMore }
}
