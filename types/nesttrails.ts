export type DeliveryStatus = "scheduled" | "dispatched" | "in_transit" | "delivered" | "failed";

export interface DeliveryItem {
  name: string;
  imageUrl: string | null;
  quantity: number;
}

export interface UserDelivery {
  id: string;
  title: string;
  deliveryDate: string;
  status: DeliveryStatus;
  trackingCode: string;
  riderName: string | null;
  riderPhone: string | null;
  items: DeliveryItem[];
  isRecurring: boolean;
}

export interface UserDeliveriesData {
  today: UserDelivery[];
  upcoming: UserDelivery[];
  past: UserDelivery[];
  summary: {
    total: number;
    upcoming: number;
    today: number;
    past: number;
  };
}

export interface UserDeliveriesResponse {
  success: boolean;
  data: UserDeliveriesData;
}

export interface PublicTrackingData {
  trackingCode: string;
  status: DeliveryStatus;
  deliveryDate: string;
  title: string;
  riderName: string | null;
  riderPhone: string | null;
  address: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    landmark?: string | null;
    notes?: string | null;
  } | null;
  items: {
    id: string;
    deliveryId: string;
    foodItemId: string;
    quantity: number;
    unitPriceAtPurchase: number;
    foodItem: {
      name: string;
      imageUrl: string | null;
      unit: string;
    };
  }[];
}

export interface PublicTrackingResponse {
  success: boolean;
  data: PublicTrackingData;
}
