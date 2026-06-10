import { api } from "./api";
import { UserDeliveriesResponse, PublicTrackingResponse } from "@/types/nesttrails";

export const nestTrailsApi = {
  /**
   * Fetch authenticated user's deliveries (today, upcoming, past)
   */
  getDeliveries: async (): Promise<{ data: UserDeliveriesResponse["data"] | null; error: string | null }> => {
    try {
      const response = await api.get<UserDeliveriesResponse>("/api/nesttrails/deliveries");
      return { data: response?.data?.data || null, error: response.error };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load deliveries";
      return { data: null, error: errorMsg };
    }
  },

  /**
   * Fetch details of a delivery by its tracking code (unauthenticated)
   */
  getPublicTracking: async (trackingCode: string): Promise<{ data: PublicTrackingResponse["data"] | null; error: string | null }> => {
    try {
      const response = await api.get<PublicTrackingResponse>(`/api/nesttrails/delivery/${trackingCode}`);
      return { data: response?.data?.data || null, error: response.error };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Tracking failed";
      return { data: null, error: errorMsg };
    }
  },
};
