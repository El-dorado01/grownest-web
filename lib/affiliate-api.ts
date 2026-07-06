// lib/affiliate-api.ts
import { apiFetch } from './api';
import type {
  Affiliate, AffiliateReferral, AffiliateCommission, EarningsSummary,
} from '@/types/affiliate';

export const affiliateApi = {
  getMe: () => apiFetch<{ affiliate: Affiliate }>('/api/affiliate/me'),

  getEarningsSummary: () => apiFetch<EarningsSummary>('/api/affiliate/me/earnings-summary'),

  getReferralsDaily: (days = 30) =>
    apiFetch<{ series: { date: string; referrals: number }[] }>(
      `/api/affiliate/me/referrals-daily?days=${days}`
    ),

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

  deleteMe: () => apiFetch('/api/affiliate/me', { method: 'DELETE' }),

  joinCampaignWaitlist: () =>
    apiFetch('/api/affiliate/campaign-waitlist', { method: 'POST' }),

  leaveCampaignWaitlist: () =>
    apiFetch('/api/affiliate/campaign-waitlist', { method: 'DELETE' }),

  getAvailableCampaigns: () =>
    apiFetch<{ campaigns: any[] }>('/api/affiliate/campaigns/available'),

  switchCampaign: (campaignId: string) =>
    apiFetch<{ affiliate: Affiliate }>('/api/affiliate/me/switch-campaign', {
      method: 'POST',
      body: JSON.stringify({ campaignId }),
      headers: { 'Content-Type': 'application/json' },
    }),

  editMe: (formData: FormData) =>
    apiFetch<{ affiliate: Affiliate }>('/api/affiliate/me/edit', {
      method: 'PATCH',
      body: formData,
      // No Content-Type — browser sets multipart/form-data with boundary
    }),

  trackSignup: (affiliateCode: string, newUserId: string) =>
    apiFetch('/api/affiliate/track-signup', {
      method: 'POST',
      body: JSON.stringify({ affiliateCode, newUserId }),
      headers: { 'Content-Type': 'application/json' },
    }),

  trackClick: (affiliateCode: string) =>
    apiFetch('/api/affiliate/track-click', {
      method: 'POST',
      body: JSON.stringify({ affiliateCode }),
      headers: { 'Content-Type': 'application/json' },
    }),
};
