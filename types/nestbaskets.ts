export interface DeliveryZone {
  id: string;
  name: string;
  baseFee: number;
  extraWeightFee: number;
}

export interface DeliveryProfile {
  id: string;
  profileId: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  landmark?: string | null;
  notes?: string | null;
  isDefault: boolean;
  deliveryZoneId?: string | null;
  deliveryZone?: DeliveryZone | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryProfilesResponse {
  success: boolean;
  data: DeliveryProfile[];
  default: DeliveryProfile | null;
  total: number;
}

export interface CreateDeliveryProfileRequest {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  landmark?: string;
  notes?: string;
  setAsDefault?: boolean;
  deliveryZoneId?: string;
}

export interface UpdateDeliveryProfileRequest {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  landmark?: string | null;
  notes?: string | null;
  deliveryZoneId?: string | null;
}

// === Food Items ===
export interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  unit: string;
  pricePerUnit: number;
  imageUrl: string | null;
  isActive: boolean;
  weightPerUnit: number;
  createdAt: string;
  updatedAt: string;
}

// === Predefined Plans ===
export interface PredefinedPlanItem {
  id: string;
  predefinedPlanId: string;
  foodItemId: string;
  quantity: number;
  foodItem: FoodItem;
}

export interface PredefinedPlan {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: PredefinedPlanItem[];
  // Unified view enrichments
  type?: "predefined";
  isCustom?: boolean;
  canEdit?: boolean;
  isSubscribed?: boolean;
  subscriptionId?: string | null;
}

// === Custom Plans ===
export interface CustomPlanItem {
  id: string;
  customPlanId: string;
  foodItemId: string;
  quantity: number;
  foodItem: FoodItem;
}

export interface CustomPlan {
  id: string;
  profileId: string;
  title: string;
  totalPrice: number;
  paymentType: "subscription" | "flexible";
  paidAmount: number;
  isPaid: boolean;
  isDelivered: boolean;
  autoPayEnabled: boolean;
  autoPayFrequency: "daily" | "weekly" | "biweekly" | "monthly" | null;
  autoPayAmount: number | null;
  autoPayStartedAt: string | null;
  autoPayNextDate: string | null;
  autoPayPaused: boolean;
  deliveryFee: number;
  deliveryProfileId: string | null;
  savingDurationMonths: number | null;
  savingExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  status: string;
  items: CustomPlanItem[];
  deliveryProfile?: DeliveryProfile | null;
  // Unified view enrichments
  type?: "custom_subscription" | "custom_flexible" | "custom";
  isCustom?: boolean;
  canEdit?: boolean;
  isSubscribed?: boolean;
  subscriptionId?: string | null;
}

// === Subscriptions ===
export interface SubscriptionItem {
  id: string;
  userSubscriptionId: string;
  foodItemId: string;
  quantity: number;
  unitPriceAtPurchase: number;
  foodItem: FoodItem;
}

export interface SubscriptionPayment {
  id: string;
  userSubscriptionId: string;
  amount: number;
  reference: string;
  status: string;
  paymentDate: string | null;
  createdAt: string;
}

export interface UserSubscription {
  id: string;
  profileId: string;
  predefinedPlanId: string | null;
  customPlanId: string | null;
  title: string;
  totalAmount: number;
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  nextDeliveryDate: string;
  status: "active" | "paused" | "cancelled";
  paymentStatus: string;
  deliveryProfileId: string | null;
  deliveryOverride?: any;
  pausedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: SubscriptionItem[];
  payments?: SubscriptionPayment[];
  deliveries?: Delivery[];
  deliveryProfile?: DeliveryProfile | null;
  predefinedPlan?: PredefinedPlan | null;
  customPlan?: CustomPlan | null;
}

// === Deliveries ===
export interface DeliveryItem {
  id: string;
  deliveryId: string;
  foodItemId: string;
  quantity: number;
  unitPriceAtPurchase: number;
  foodItem: FoodItem;
}

export interface Delivery {
  id: string;
  userSubscriptionId: string | null;
  customPlanId: string | null;
  deliveryDate: string;
  status: "scheduled" | "dispatched" | "in_transit" | "delivered" | "failed";
  trackingCode: string | null;
  riderName: string | null;
  riderPhone: string | null;
  deliveredAt: string | null;
  isRecurring: boolean;
  deliveryFee: number;
  deliveryProfileId: string | null;
  addressSnapshot?: any;
  itemsSnapshot?: DeliveryItem[];
}

// === API Request Payloads ===
export interface CreateCustomPlanRequest {
  title: string;
  items: {
    foodItemId: string;
    quantity: number;
  }[];
  paymentType: "subscription" | "flexible";
  deliveryProfileId?: string;
  savingExpiresAt?: string; // Datetime string
}

export interface SubscribeRequest {
  predefinedPlanId?: string;
  customPlanId?: string;
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  useDefaultDelivery?: boolean;
  deliveryOverride?: {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    landmark?: string;
    notes?: string;
  };
  pin?: string; // Optional 4-digit PIN
}

export interface FlexiblePaymentRequest {
  customPlanId: string;
  amount: number;
  pin?: string; // Optional 4-digit PIN
}

export interface SetupAutoPayRequest {
  customPlanId: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly";
  amount: number;
  pin?: string; // Optional 4-digit PIN
}

