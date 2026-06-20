// lib/affiliate-api.ts
import { apiFetch } from './api';
import type {
  Affiliate, AffiliateReferral, AffiliateCommission, EarningsSummary,
} from '@/types/affiliate';

export const affiliateApi = {
  getMe: () => apiFetch<{ affiliate: Affiliate }>('/api/affiliate/me'),

  getEarningsSummary: () => apiFetch<EarningsSummary>('/api/affiliate/me/earnings-summary'),

  getReferrals: (page = 1) =>
    apiFetch<{ referrals: AffiliateReferral[]; total: number }>(
      `/api/affiliate/me/referrals?page=${page}&limit=20`
    ),

  getCommissions: (status?: string) =>
    apiFetch<{ commissions: AffiliateCommission[] }>(
      `/api/affiliate/me/commissions${status ? `?status=${status}` : ''}`
    ),

  apply: (formData: FormData) =>
    apiFetch<{ affiliate: Affiliate }>('/api/affiliate/apply', {
      method: 'POST',
      body: formData,
      // Do not set Content-Type — browser sets it with boundary for multipart
    }),
};
