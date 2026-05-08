import { api } from "./api";
import { 
  DeliveryProfilesResponse, 
  CreateDeliveryProfileRequest, 
  UpdateDeliveryProfileRequest,
  DeliveryProfile,
  DeliveryZone
} from "@/types/nestbaskets";

export const nestBasketsApi = {
  // Delivery Profiles
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

  // Delivery Zones
  getDeliveryZones: () =>
    api.get<{ success: boolean; data: DeliveryZone[] }>("/api/nesttrails/zones"),

  calculateDeliveryFee: (data: { deliveryZoneId: string; items: any[] }) =>
    api.post<{ success: boolean; fee: number }>("/api/nesttrails/calculate-delivery-fee", data),
};

