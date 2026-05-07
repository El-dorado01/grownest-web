// types/group-nestegg.ts

export type GroupStatus = 'active' | 'completed' | 'cancelled'
export type MemberRole = 'owner' | 'member'
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'
export type GroupFrequency = 'daily' | 'weekly' | 'monthly'
export type ScoreboardMedal = 'gold' | 'silver' | 'bronze' | null

export interface GroupMember {
  id: string
  profileId: string
  fullName: string | null
  email: string
  profilePhoto: string | null
  role: MemberRole
  joinedAt: string
  isAutoSaveEnabled: boolean
  autoSaveAmount: number | null
  frequency: GroupFrequency | null
  isAutoSavePaused: boolean
  totalContributed: number
}

export interface GroupNestEgg {
  id: string
  cover: string | null
  title: string
  description: string | null
  targetAmount: number
  savedAmount: number
  currency: string
  startDate: string
  endDate: string
  status: GroupStatus
  maxMembers: number
  memberCount: number
  progress: number
  daysRemaining: number
  isMature: boolean
  ownerId: string
  owner: {
    profileId: string
    fullName: string | null
    email: string
  }
  members: GroupMember[]
}

export interface GroupListItem {
  id: string
  cover: string | null
  title: string
  description: string | null
  targetAmount: number
  savedAmount: number
  progress: number
  daysRemaining: number
  status: GroupStatus
  maxMembers: number
  memberCount: number
  ownerId: string
  members: Array<{
    profileId: string
    role: MemberRole
    profile: { fullName: string | null }
    isActive?: boolean
  }>
}

export interface ScoreboardEntry {
  memberId: string
  fullName: string
  profilePhoto: string | null
  role: MemberRole
  thisWeekAmount: number
  contributionCount: number
  changePercent: number | null
  isUp: boolean
  isDown: boolean
  isNew: boolean
  rank: number
  medal: ScoreboardMedal
}

export interface WeeklyScoreboard {
  groupId: string
  groupTitle: string
  weekStart: string
  weekEnd: string
  totalMembers: number
  totalContributedThisWeek: number
  scoreboard: ScoreboardEntry[]
  updatedAt: string
}

export interface GroupContribution {
  id: string
  amount: number
  type: string
  source: string
  reference: string
  timestamp: string
  contributor: {
    fullName: string
    profilePhoto: string | null
  }
}

export interface GroupContributionsResponse {
  message: string
  group: { id: string; title: string }
  contributions: GroupContribution[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface PendingInvite {
  id: string
  email: string
  role: MemberRole
  invitedAt: string
  expiresAt: string
  fullName: string | null
  profilePhoto: string | null
  hasAccount: boolean
}

export interface PendingInvitesResponse {
  groupId: string
  groupTitle: string
  pendingInvites: PendingInvite[]
  total: number
}

export interface ReceivedInvitation {
  invitationId: string
  token: string
  group: {
    id: string
    title: string
    cover: string | null
    owner: {
      fullName: string | null
      profilePhoto: string | null
    }
  }
  role: MemberRole
  status: InvitationStatus
  invitedBy: string
  invitedAt: string
  expiresAt: string
  respondedAt: string | null
  isPending: boolean
  isAccepted: boolean
  isExpired: boolean
  canAccept: boolean
}

export interface MyInvitationsResponse {
  message: string
  total: number
  pending: ReceivedInvitation[]
  accepted: ReceivedInvitation[]
  expired: ReceivedInvitation[]
  summary: {
    pendingCount: number
    acceptedCount: number
    expiredCount: number
  }
}

// Request types
export interface CreateGroupRequest {
  title: string
  cover?: string
  description?: string
  targetAmount: number
  durationDays: number
  maxMembers: number
}

export interface InviteMemberRequest {
  groupNestEggId: string
  email: string
  role?: MemberRole
}

export interface GroupContributeRequest {
  groupNestEggId: string
  amount: number
  pin?: string
}

export interface EnableGroupAutoSaveRequest {
  autoSaveAmount: number
  frequency: GroupFrequency
  pin?: string
}

export interface UpdateGroupAutoSaveRequest {
  isAutoSavePaused?: boolean
  autoSaveAmount?: number
}

// Response types
export interface MyGroupsResponse {
  groups: GroupListItem[]
}

export interface GroupDetailResponse {
  message: string
  group: GroupNestEgg
}

export interface GroupContributeResponse {
  message: string
  amountContributed: number
  savedAmount: number
  progress: number
  reference: string
  requirePin?: boolean
}

export interface InviteResponse {
  message: string
  invitationId: string
  expiresAt: string
  previewLink: string
}

export interface AcceptInviteResponse {
  message: string
  group: { id: string; title: string }
}
