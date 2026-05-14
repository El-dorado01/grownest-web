import { api } from '@/lib/api'
import type {
  NestEggsListResponse,
  FixedNestEggsResponse,
  BalanceSummary,
  NestEggDetailResponse,
  ContributionsResponse,
  AutoSaveStatus,
  ContributeResponse,
  WithdrawResponse,
  RepayResponse,
  UpdateAutoSaveResponse,
  CreateNestEggRequest,
  ContributeRequest,
  UpdateAutoSaveRequest,
  ManualWithdrawRequest,
} from '@/types/nesteggs'

export const nestEggsApi = {
  list: (page = 1, limit = 15) =>
    api.get<NestEggsListResponse>(`/api/nesteggs?page=${page}&limit=${limit}`),

  balanceSummary: () =>
    api.get<BalanceSummary>('/api/nesteggs/balance-summary'),

  fixed: () =>
    api.get<FixedNestEggsResponse>('/api/nesteggs/fixed'),

  get: (id: string) =>
    api.get<NestEggDetailResponse>(`/api/nesteggs/${id}`),

  contributions: (id: string, page = 1, limit = 20) =>
    api.get<ContributionsResponse>(
      `/api/nesteggs/${id}/contributions?page=${page}&limit=${limit}`
    ),

  autoSaveStatus: (id: string) =>
    api.get<AutoSaveStatus>(`/api/nesteggs/${id}/autosave-status`),

  create: (data: CreateNestEggRequest) =>
    api.post<{ message: string; nestEgg: NestEggDetailResponse }>('/api/nesteggs/create', data),

  contribute: (data: ContributeRequest) =>
    api.post<ContributeResponse>('/api/nesteggs/contribute', data),

  completeWithdraw: (nestEggId: string) =>
    api.post<WithdrawResponse>('/api/nesteggs/complete-withdraw', { nestEggId }),

  manualWithdraw: (data: ManualWithdrawRequest) =>
    api.post<WithdrawResponse>('/api/nesteggs/manual-withdraw', data),

  repayWithdrawal: (data: ManualWithdrawRequest) =>
    api.post<RepayResponse>('/api/nesteggs/repay-withdrawal', data),

  updateAutoSave: (id: string, data: UpdateAutoSaveRequest) =>
    api.patch<UpdateAutoSaveResponse>(`/api/nesteggs/${id}/update-autosave`, data),

  cancel: (nestEggId: string) =>
    api.delete<{ message: string }>('/api/nesteggs/cancel', { nestEggId }),
}
