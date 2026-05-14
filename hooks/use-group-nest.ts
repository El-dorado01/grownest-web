"use client"

import useSWR from "swr"
import { groupNestEggApi } from "@/lib/group-nestegg-api"

export function useGroupNest() {
  const {
    data: groupsRes,
    error: groupsError,
    isLoading: groupsLoading,
    mutate: mutateGroups,
  } = useSWR(
    "group-nest-groups",
    () => groupNestEggApi.myGroups(),
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 2000,
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

  const groups = groupsRes?.data?.groups || []
  const pendingInvites = invitesRes?.data?.pending || []
  const isLoading = groupsLoading || invitesLoading
  const error = !!(groupsError || groupsRes?.error || invitesError || invitesRes?.error)

  const mutate = () => Promise.all([mutateGroups(), mutateInvites()])

  return { groups, pendingInvites, isLoading, error, mutate }
}
