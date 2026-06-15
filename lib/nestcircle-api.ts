import { api } from "./api"

export interface CircleMember {
  id: string
  name: string
  email: string
  profilePhoto: string | null
  joinedAt: string
  rewardPaid: boolean
  rewardPoints: number
  paidAt: string | null
  isFullyVerified: boolean
}

export interface PointTransaction {
  id: string
  points: number
  reason: string
  metadata: Record<string, any> | null
  createdAt: string
}

export interface NestCircleData {
  referralCode: string
  referralLink: string
  pointsBalance: number
  pointsValueNaira: number
  stats: {
    totalReferrals: number
    rewardedReferrals: number
    pendingReferrals: number
    totalPointsEarned: number
    totalValueNaira: number
  }
  circle: CircleMember[]
  recentPointTransactions: PointTransaction[]
  minRedemptionPoints: number
  minRedemptionNaira: number
  conversionRate: { points: number; naira: number }
}

export interface RedeemPayload {
  redemptionType?: 'airtime' | 'data' | 'cabletv' | 'electricity'
  pointsToRedeem: number
  pin: string
  phoneNumber?: string
  network?: string
  disco?: string
  customerId?: string
  meterType?: string
  cableTvType?: string
}

export const nestCircleApi = {
  getCircle: async (): Promise<{ data: NestCircleData | null; error: string | null }> => {
    try {
      const response = await api.get<NestCircleData>("/api/nestcircle")
      return { data: response?.data || null, error: response.error }
    } catch (err: any) {
      return { data: null, error: err.message || "Failed to load NestCircle data" }
    }
  },

  redeemPoints: async (
    payload: RedeemPayload
  ): Promise<{ data: any | null; error: string | null }> => {
    try {
      const response = await api.post("/api/nestcircle/redeem", payload)
      return { data: response?.data || null, error: response.error }
    } catch (err: any) {
      return { data: null, error: err.message || "Redemption failed. Please try again." }
    }
  },
}
