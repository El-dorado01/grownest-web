// lib/campaign-api.ts — user-facing Nest Egg Campaign API
import { api } from "@/lib/api";
import type {
  CampaignListResponse,
  CampaignDetailResponse,
  MyCampaignsResponse,
} from "@/types/campaign";

export const campaignApi = {
  list: () => api.get<CampaignListResponse>("/api/nesteggs/campaigns"),

  mine: () => api.get<MyCampaignsResponse>("/api/nesteggs/campaigns/mine"),

  get: (id: string) =>
    api.get<CampaignDetailResponse>(`/api/nesteggs/campaigns/${id}`),

  join: (id: string, deliveryProfileId?: string) =>
    api.post<{ success: boolean }>(`/api/nesteggs/campaigns/${id}/join`, {
      deliveryProfileId,
    }),

  leave: (id: string) =>
    api.delete<{ success: boolean; netAmount: number }>(
      `/api/nesteggs/campaigns/${id}/leave`,
    ),
};
