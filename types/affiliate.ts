// types/affiliate.ts

export type AffiliateStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
export type CommissionStatus = 'PENDING' | 'AVAILABLE' | 'PAID' | 'REVERSED';
export type CommissionType = 'FIXED' | 'PERCENTAGE';
export type SocialPlatform =
  | 'FACEBOOK' | 'INSTAGRAM' | 'X'
  | 'WHATSAPP_CHANNEL' | 'WHATSAPP_STATUS'
  | 'YOUTUBE' | 'TIKTOK';

export interface AffiliateCampaign {
  id: string;
  name: string;
  description: string | null;
  commissionType: CommissionType;
  commissionValue: number;
  minDepositAmount: number;
  holdDays: number;
  isActive: boolean;
}

export interface AffiliateSocialHandle {
  id: string;
  platform: SocialPlatform;
  handle: string;
  platformLink: string | null;
  followersCount: number | null;
  screenshotUrls: string[];
  verifiedByAdmin: boolean;
}

export interface Affiliate {
  id: string;
  affiliateCode: string;
  status: AffiliateStatus;
  promoNote: string | null;
  approvedAt: string | null;
  defaultCampaignId: string | null;
  campaign: AffiliateCampaign | null;
  socialHandles: AffiliateSocialHandle[];
  createdAt: string;
}

export interface AffiliateReferral {
  id: string;
  displayName: string;
  signedUpAt: string;
  qualified: boolean;
  firstDepositAt: string | null;
  commission: { amount: number; status: CommissionStatus } | null;
}

export interface AffiliateCommission {
  id: string;
  referralId: string;
  amount: number;
  status: CommissionStatus;
  pendingSince: string;
  availableAt: string;
  paidAt: string | null;
  createdAt: string;
}

export interface EarningsSummary {
  totalEarned: number;
  pending: number;
  available: number;
  paid: number;
  nextPayoutDate: string;
  totalReferrals: number;
  qualifiedReferrals: number;
  tier: 'STARTER' | 'GROWTH' | 'PROFESSIONAL' | 'ELITE';
  totalClicks: number;
}
