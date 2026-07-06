// lib/legal-api.ts
import { apiFetch } from './api';

export type PolicyType = 'TERMS' | 'PRIVACY' | 'COOKIES' | 'REFUND_POLICY' | 'AFFILIATE_TERMS' | 'VENDOR_AGREEMENT';

export interface PolicyStatusResponse {
  needsReacceptance: boolean;
  outstanding: { policyType: PolicyType; currentVersion: string; acceptedVersion: string | null }[];
}

export const legalApi = {
  getStatus: () => apiFetch<PolicyStatusResponse>('/api/legal/policy-status'),

  accept: (policyType: PolicyType) =>
    apiFetch('/api/legal/accept', {
      method: 'POST',
      body: JSON.stringify({ policyType }),
      headers: { 'Content-Type': 'application/json' },
    }),

  acceptBatch: (policyTypes: PolicyType[]) =>
    apiFetch('/api/legal/accept-batch', {
      method: 'POST',
      body: JSON.stringify({ policyTypes }),
      headers: { 'Content-Type': 'application/json' },
    }),
};
