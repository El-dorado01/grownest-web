import { api } from "./api";
import { 
  DeliveryProfilesResponse, 
  CreateDeliveryProfileRequest, 
  UpdateDeliveryProfileRequest,
  DeliveryProfile,
  DeliveryZone,
  Branch,
  FoodItem,
  PredefinedPlan,
  CustomPlan,
  UserSubscription,
  CreateCustomPlanRequest,
  SubscribeRequest,
  FlexiblePaymentRequest,
  SetupAutoPayRequest
} from "@/types/nestbaskets";

export const nestBasketsApi = {
  // ─── DELIVERY PROFILES & ZONES (NESTRAILS) ───
  getDeliveryProfiles: () =>
    api.get<DeliveryProfilesResponse>("/api/nesttrails/delivery-profiles"),

  createDeliveryProfile: (data: CreateDeliveryProfileRequest) =>
    api.post<{ success: boolean; message: string; data: DeliveryProfile }>("/api/nesttrails/delivery-profiles", data),

  updateDeliveryProfile: (id: string, data: UpdateDeliveryProfileRequest) =>
    api.patch<{ success: boolean; message: string; data: DeliveryProfile }>(`/api/nesttrails/delivery-profiles/${id}`, data),

  setDefaultDeliveryProfile: (id: string) =>
    api.patch<{ success: boolean; message: string }>(`/api/nesttrails/delivery-profiles/${id}/default`, {}),

  deleteDeliveryProfile: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/api/nesttrails/delivery-profiles/${id}`),

  getDeliveryZones: () =>
    api.get<{ success: boolean; data: DeliveryZone[] }>("/api/nesttrails/zones"),

  calculateDeliveryFee: (data: { deliveryZoneId: string; items: any[] }) =>
    api.post<{ success: boolean; fee: number }>("/api/nesttrails/calculate-delivery-fee", data),

  getPickupBranches: () =>
    api.get<{ success: boolean; data: Branch[] }>("/api/nesttrails/branches"),

  // ─── NESTBASKETS PLANS & ITEMS ───
  getPredefinedPlans: () =>
    api.get<{ success: boolean; message: string; data: PredefinedPlan[]; total: number }>("/api/nestbaskets/plans/predefined"),

  getAllPlans: () =>
    api.get<{ success: boolean; message: string; data: { predefined: PredefinedPlan[]; custom: CustomPlan[]; total: number } }>("/api/nestbaskets/plans"),

  getPlanDetails: (id: string) =>
    api.get<{ success: boolean; message: string; data: any }>(`/api/nestbaskets/plan/${id}`),

  getFoodItems: () =>
    api.get<{ success: boolean; message: string; data: FoodItem[] }>("/api/nestbaskets/food-items"),

  getMinBasketValueSetting: () =>
    api.get<{ success: boolean; data: { enabled: boolean; value: number } }>("/api/nestbaskets/custom-plan/min-basket-value"),

  confirmDeliveryReceived: (deliveryId: string) =>
    api.post<{ success: boolean; message: string }>(`/api/nestbaskets/delivery/${deliveryId}/confirm-received`, {}),

  // ─── NESTBASKETS CUSTOM PLAN CRUD ───
  createCustomPlan: (data: CreateCustomPlanRequest) =>
    api.post<{ success: boolean; message: string; data: { customPlan: CustomPlan; breakdown: any[]; totalPrice: number } }>("/api/nestbaskets/custom-plan", data),

  updateCustomPlanAddress: (id: string, deliveryProfileId: string) =>
    api.patch<{ success: boolean; message: string; data: CustomPlan }>(`/api/nestbaskets/custom-plan/${id}/address`, { deliveryProfileId }),

  deleteCustomPlan: (id: string, pin?: string) =>
    api.delete<{ success: boolean; message: string; data: { deletedPlanId: string; title: string; refundAmount: number; newBalance: number } }>(`/api/nestbaskets/custom-plan/${id}`, { pin }),

  // ─── NESTBASKETS RECURRING SUBSCRIPTIONS ───
  subscribeToPlan: (data: SubscribeRequest) =>
    api.post<{ success: boolean; message: string; data: UserSubscription; requirePin?: boolean }>("/api/nestbaskets/subscribe", data),

  getMySubscriptions: () =>
    api.get<{ success: boolean; message: string; data: UserSubscription[]; total: number }>("/api/nestbaskets/my-subscriptions"),

  getSubscriptionDetails: (id: string) =>
    api.get<{ success: boolean; message: string; data: UserSubscription }>(`/api/nestbaskets/subscription/${id}`),

  pauseSubscription: (id: string) =>
    api.patch<{ success: boolean; message: string; data: UserSubscription }>(`/api/nestbaskets/subscription/${id}/pause`),

  resumeSubscription: (id: string) =>
    api.patch<{ success: boolean; message: string; data: UserSubscription }>(`/api/nestbaskets/subscription/${id}/resume`),

  cancelSubscription: (id: string) =>
    api.delete<{ success: boolean; message: string; data: { subscription: UserSubscription; refundAmount: number; newBalance: number } }>(`/api/nestbaskets/subscription/${id}`),

  // ─── NESTBASKETS FLEXIBLE SAVINGS ───
  getMyFlexiblePlans: () =>
    api.get<{ success: boolean; message: string; data: CustomPlan[]; summary: any }>("/api/nestbaskets/my-flexible-plans"),

  getFlexiblePlanDetails: (id: string) =>
    api.get<{ success: boolean; message: string; data: any }>(`/api/nestbaskets/flexible-plan/${id}`),

  makeFlexiblePayment: (data: FlexiblePaymentRequest) =>
    api.post<{ success: boolean; message: string; data: { plan: CustomPlan; progress: string; canRequestDelivery: boolean; newBalance: number }; requirePin?: boolean }>("/api/nestbaskets/flexible-payment", data),

  setupAutoPay: (data: SetupAutoPayRequest) =>
    api.post<{ success: boolean; message: string; data: { plan: CustomPlan; nextPaymentDate: string; frequency: string; amount: number }; requirePin?: boolean }>("/api/nestbaskets/auto-pay/setup", data),

  disableAutoPay: (customPlanId: string) =>
    api.post<{ success: boolean; message: string; data: { plan: CustomPlan } }>("/api/nestbaskets/auto-pay/disable", { customPlanId }),

  procureFlexiblePlan: (id: string, selectedItems: { foodItemId: string; quantity: number }[]) =>
    api.post<{ success: boolean; message: string; data: { delivery: any; refundAmount: number; newBalance: number } }>(`/api/nestbaskets/flexible-plan/${id}/procure`, { selectedItems }),
};


