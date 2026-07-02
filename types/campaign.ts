// types/campaign.ts — Nest Egg Campaign types (user-facing)

export type CampaignStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type CampaignFrequency = "DAILY" | "WEEKLY" | "MONTHLY";
export type CampaignPayoutType = "CASH" | "GOODS";
export type MembershipStatus = "ACTIVE" | "EXITED" | "KICKED" | "COMPLETED";

export interface CampaignMembershipSummary {
  status: MembershipStatus;
  savedAmount: number;
  nextContributionDate: string;
  gracePeriodStartedAt: string | null;
}

export interface NestEggCampaign {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  category: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  joinDeadline: string;
  minMembers: number | null;
  maxMembers: number | null;
  contributionAmount: number;
  frequency: CampaignFrequency;
  interestRate: number;
  penaltyRate: number;
  gracePeriodDays: number;
  payoutType: CampaignPayoutType;
  goodsDescription: string | null;
  memberCount: number;
  totalPot: number | null;
  myMembership: CampaignMembershipSummary | null;
}

export interface CampaignMembership {
  id: string;
  campaignId: string;
  status: MembershipStatus;
  savedAmount: number;
  savedAmountEnc?: string;
  nextContributionDate: string;
  lastContributionDate: string | null;
  gracePeriodStartedAt: string | null;
  joinedAt: string;
  deliveryOption: string | null;
  deliveryAddressSnapshot: Record<string, string> | null;
  campaign?: NestEggCampaign;
}

export interface CampaignListResponse {
  data: NestEggCampaign[];
}
export interface CampaignDetailResponse {
  data: NestEggCampaign;
}
export interface MyCampaignsResponse {
  data: CampaignMembership[];
}
