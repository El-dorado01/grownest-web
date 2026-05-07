// types/nesteggs.ts

export type NestEggFrequency = 'daily' | 'weekly' | 'monthly'
export type NestEggStatus = 'active' | 'completed' | 'cancelled'
export type ContributionType = 'manual' | 'auto' | 'withdrawal' | 'repayment'
export type ContributionSource = 'wallet' | 'flexible'

export interface NestEgg {
  id: string
  profileId: string
  title: string
  cover: string | null
  targetAmount: number
  savedAmount: number
  progress: number
  startDate: string
  endDate: string
  daysRemaining: number
  isMature: boolean
  canWithdraw: boolean
  isAutoSave: boolean
  isAutoSavePaused: boolean
  autoSaveAmount: number | null
  frequency: NestEggFrequency | null
  isFixed: boolean
  fixedInterestRate: number | null
  canEarlyWithdraw: boolean
  status: NestEggStatus
  totalWithdrawnPercent: number
  lastWithdrawalRepaid: boolean
  interestEarned: number | null
  createdAt: string
}

export interface FixedNestEgg extends NestEgg {
  expectedInterest: number
  totalOnMaturity: number
  daysToMaturity: number
}

export interface NestEggContribution {
  id: string
  nestEggId?: string
  amount: number
  type: ContributionType
  source: ContributionSource
  reference: string
  timestamp: string
  contributor: string
}

export interface BalanceSummaryGoal {
  id: string
  title: string
  cover: string | null
  saved: number
  target: number
  isFixed: boolean
  progress: number
}

export interface BalanceSummaryGroup {
  groupId: string
  groupTitle: string
  cover: string | null
  mySaved: number
  thisWeekSaved: number
}

export interface BalanceSummary {
  asOf: string
  weekStart: string
  weekEnd: string
  personal: {
    total: number
    count: number
    goals: BalanceSummaryGoal[]
  }
  group: {
    total: number
    count: number
    groups: BalanceSummaryGroup[]
  }
  thisWeek: {
    personal: number
    group: number
    total: number
  }
  grandTotal: number
  currency: string
}

export interface AutoSaveStatus {
  isAutoSaveEnabled: boolean
  isPaused: boolean
  autoSaveAmount: number | null
  frequency: NestEggFrequency | null
  lastAutoSave: string | null
}

export interface NestEggDetailResponse extends NestEgg {
  outstanding: number
  contributions: NestEggContribution[]
}

// Request types
export interface CreateNestEggRequest {
  title: string
  cover?: string
  targetAmount: number
  durationDays: number
  isAutoSave: boolean
  frequency?: NestEggFrequency
  autoSaveAmount?: number
  isFixed?: boolean
}

export interface ContributeRequest {
  nestEggId: string
  amount: number
  pin?: string
}

export interface UpdateAutoSaveRequest {
  isAutoSave?: boolean
  frequency?: NestEggFrequency
  autoSaveAmount?: number
  isAutoSavePaused?: boolean
}

export interface ManualWithdrawRequest {
  nestEggId: string
  amount: number
}

// Response types
export interface NestEggsListResponse {
  nestEggs: NestEgg[]
  total: number
}

export interface FixedNestEggsResponse {
  fixedNestEggs: FixedNestEgg[]
  total: number
}

export interface ContributionsResponse {
  message: string
  nestEgg: { id: string; title: string }
  outstanding: number
  contributions: NestEggContribution[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ContributeResponse {
  message: string
  savedAmount: number
  progress: number
  reference: string
  requirePin?: boolean
}

export interface WithdrawResponse {
  message?: string
  success?: boolean
  amount: number
  interest?: number
  totalReceived?: number
  wasFixed?: boolean
  lifetimeWithdrawnPercent?: number
  remainingPercent?: number
  error?: string
  maxWithdrawable?: number
}

export interface RepayResponse {
  success: boolean
  message: string
  amount: number
  fullyRepaid: boolean
  remainingOutstanding: number
}

export interface UpdateAutoSaveResponse {
  message: string
  isAutoSave: boolean
  isAutoSavePaused: boolean
  autoSaveAmount: number | null
  frequency: NestEggFrequency | null
}
