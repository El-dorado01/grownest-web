// lib/group-nestegg-api.ts
import { api } from '@/lib/api'
import type {
  MyGroupsResponse,
  GroupDetailResponse,
  GroupContributionsResponse,
  WeeklyScoreboard,
  PendingInvitesResponse,
  MyInvitationsResponse,
  GroupContributeResponse,
  InviteResponse,
  AcceptInviteResponse,
  CreateGroupRequest,
  InviteMemberRequest,
  GroupContributeRequest,
  EnableGroupAutoSaveRequest,
  UpdateGroupAutoSaveRequest,
} from '@/types/group-nestegg'

export const groupNestEggApi = {
  myGroups: (page = 1, limit = 15) =>
    api.get<MyGroupsResponse>(`/api/nesteggs/group/my-groups?page=${page}&limit=${limit}`),

  myInvitations: () =>
    api.get<MyInvitationsResponse>('/api/nesteggs/group/my-invitations'),

  get: (id: string) =>
    api.get<GroupDetailResponse>(`/api/nesteggs/group/${id}`),

  contributions: (id: string, page = 1, limit = 20) =>
    api.get<GroupContributionsResponse>(
      `/api/nesteggs/group/${id}/contributions?page=${page}&limit=${limit}`
    ),

  scoreboard: (groupId: string) =>
    api.get<WeeklyScoreboard>(`/api/nesteggs/group/${groupId}/weekly-scoreboard`),

  pendingInvites: (groupId: string) =>
    api.get<PendingInvitesResponse>(`/api/nesteggs/group/${groupId}/pending-invites`),

  create: (data: CreateGroupRequest) =>
    api.post<{ message: string; group: { id: string; title: string } }>(
      '/api/nesteggs/group/create',
      data
    ),

  invite: (data: InviteMemberRequest) =>
    api.post<InviteResponse>('/api/nesteggs/group/invite', data),

  acceptInvite: (token: string) =>
    api.post<AcceptInviteResponse>('/api/nesteggs/group/accept-invite', { token }),

  declineInvite: (token: string) =>
    api.post<{ message: string }>('/api/nesteggs/group/decline-invite', { token }),

  contribute: (data: GroupContributeRequest) =>
    api.post<GroupContributeResponse>('/api/nesteggs/group/contribute', data),

  enableAutoSave: (id: string, data: EnableGroupAutoSaveRequest) =>
    api.post<{ success: boolean; message: string }>(
      `/api/nesteggs/group/${id}/enable-autosave`,
      data
    ),

  updateAutoSave: (id: string, data: UpdateGroupAutoSaveRequest) =>
    api.patch<{ message: string }>(`/api/nesteggs/group/${id}/update-autosave`, data),

  disableAutoSave: (id: string) =>
    api.post<{ message: string }>(`/api/nesteggs/group/${id}/disable-autosave`, {}),

  delete: (id: string) =>
    api.delete<{ message: string; groupId: string; title: string; warning?: string }>(
      `/api/nesteggs/group/${id}`
    ),
}
