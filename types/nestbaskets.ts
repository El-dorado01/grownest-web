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
