"use client";

import useSWR from "swr";
import { nestTrailsApi } from "@/lib/nesttrails-api";
import { UserDeliveriesData, PublicTrackingData } from "@/types/nesttrails";

export function useMyDeliveries() {
  const { data: res, error: swrError, isLoading, mutate } = useSWR<{ data: UserDeliveriesData | null; error: string | null }>(
    "user-deliveries",
    () => nestTrailsApi.getDeliveries(),
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 5000,
    }
  );

  const deliveriesData = res?.data ?? null;
  const error = swrError || res?.error;

  return {
    deliveriesData,
    isLoading,
    error: !!error,
    errorMsg: typeof error === "string" ? error : null,
    mutate,
  };
}

const DEMO_TRACKING: Record<string, PublicTrackingData> = {
  "DEL-908124": {
    trackingCode: "DEL-908124",
    status: "in_transit",
    deliveryDate: new Date().toISOString(),
    title: "Premium Keto Meal Plan",
    riderName: "Chinedu Okafor",
    riderPhone: "+234 812 345 6789",
    address: {
      fullName: "Sarah Jenkins",
      phone: "+234 803 111 2222",
      address: "45 Cooper Road, Ikoyi",
      city: "Lagos",
      state: "Lagos State",
      landmark: "Near Golden Gate Restaurant",
      notes: "Please call upon arrival"
    },
    items: [
      {
        id: "demo-item-1",
        deliveryId: "demo-1",
        foodItemId: "food-1",
        quantity: 1,
        unitPriceAtPurchase: 4500,
        foodItem: {
          name: "Keto Grilled Salmon",
          imageUrl: null,
          unit: "portion"
        }
      },
      {
        id: "demo-item-2",
        deliveryId: "demo-1",
        foodItemId: "food-2",
        quantity: 2,
        unitPriceAtPurchase: 1800,
        foodItem: {
          name: "Avocado Salad",
          imageUrl: null,
          unit: "bowl"
        }
      },
      {
        id: "demo-item-3",
        deliveryId: "demo-1",
        foodItemId: "food-3",
        quantity: 1,
        unitPriceAtPurchase: 1200,
        foodItem: {
          name: "Almond Flour Muffins",
          imageUrl: null,
          unit: "pack"
        }
      }
    ]
  },
  "DEL-304912": {
    trackingCode: "DEL-304912",
    status: "dispatched",
    deliveryDate: new Date().toISOString(),
    title: "Family Weekend Basket",
    riderName: "Amina Yusuf",
    riderPhone: "+234 905 876 5432",
    address: {
      fullName: "Sarah Jenkins",
      phone: "+234 803 111 2222",
      address: "45 Cooper Road, Ikoyi",
      city: "Lagos",
      state: "Lagos State",
      landmark: "Near Golden Gate Restaurant",
      notes: null
    },
    items: [
      {
        id: "demo-item-4",
        deliveryId: "demo-2",
        foodItemId: "food-4",
        quantity: 2,
        unitPriceAtPurchase: 2500,
        foodItem: {
          name: "Organic Farm Eggs",
          imageUrl: null,
          unit: "crate"
        }
      },
      {
        id: "demo-item-5",
        deliveryId: "demo-2",
        foodItemId: "food-5",
        quantity: 1,
        unitPriceAtPurchase: 3500,
        foodItem: {
          name: "Fresh Strawberries",
          imageUrl: null,
          unit: "pack"
        }
      }
    ]
  },
  "DEL-410982": {
    trackingCode: "DEL-410982",
    status: "scheduled",
    deliveryDate: new Date(Date.now() + 86400000).toISOString(),
    title: "Vegan Weekly Subscription",
    riderName: null,
    riderPhone: null,
    address: {
      fullName: "Sarah Jenkins",
      phone: "+234 803 111 2222",
      address: "45 Cooper Road, Ikoyi",
      city: "Lagos",
      state: "Lagos State",
      landmark: "Near Golden Gate Restaurant",
      notes: null
    },
    items: [
      {
        id: "demo-item-6",
        deliveryId: "demo-3",
        foodItemId: "food-6",
        quantity: 2,
        unitPriceAtPurchase: 2800,
        foodItem: {
          name: "Quinoa Buddha Bowl",
          imageUrl: null,
          unit: "bowl"
        }
      },
      {
        id: "demo-item-7",
        deliveryId: "demo-3",
        foodItemId: "food-7",
        quantity: 3,
        unitPriceAtPurchase: 1500,
        foodItem: {
          name: "Cold Pressed Greens",
          imageUrl: null,
          unit: "bottle"
        }
      }
    ]
  },
  "DEL-512039": {
    trackingCode: "DEL-512039",
    status: "scheduled",
    deliveryDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    title: "Breakfast Berry Boost",
    riderName: null,
    riderPhone: null,
    address: {
      fullName: "Sarah Jenkins",
      phone: "+234 803 111 2222",
      address: "45 Cooper Road, Ikoyi",
      city: "Lagos",
      state: "Lagos State",
      landmark: "Near Golden Gate Restaurant",
      notes: null
    },
    items: [
      {
        id: "demo-item-8",
        deliveryId: "demo-4",
        foodItemId: "food-8",
        quantity: 3,
        unitPriceAtPurchase: 2200,
        foodItem: {
          name: "Mixed Berry Parfait",
          imageUrl: null,
          unit: "portion"
        }
      }
    ]
  },
  "DEL-109283": {
    trackingCode: "DEL-109283",
    status: "delivered",
    deliveryDate: new Date(Date.now() - 86400000).toISOString(),
    title: "High Protein Lunch Box",
    riderName: null,
    riderPhone: null,
    address: {
      fullName: "Sarah Jenkins",
      phone: "+234 803 111 2222",
      address: "45 Cooper Road, Ikoyi",
      city: "Lagos",
      state: "Lagos State",
      landmark: "Near Golden Gate Restaurant",
      notes: null
    },
    items: [
      {
        id: "demo-item-9",
        deliveryId: "demo-5",
        foodItemId: "food-9",
        quantity: 1,
        unitPriceAtPurchase: 3200,
        foodItem: {
          name: "Lemon Herb Chicken Breast",
          imageUrl: null,
          unit: "portion"
        }
      },
      {
        id: "demo-item-10",
        deliveryId: "demo-5",
        foodItemId: "food-10",
        quantity: 1,
        unitPriceAtPurchase: 1500,
        foodItem: {
          name: "Brown Rice & Broccoli",
          imageUrl: null,
          unit: "portion"
        }
      }
    ]
  },
  "DEL-087124": {
    trackingCode: "DEL-087124",
    status: "failed",
    deliveryDate: new Date(Date.now() - 86400000 * 3).toISOString(),
    title: "Fresh Fruits Medley",
    riderName: null,
    riderPhone: null,
    address: {
      fullName: "Sarah Jenkins",
      phone: "+234 803 111 2222",
      address: "45 Cooper Road, Ikoyi",
      city: "Lagos",
      state: "Lagos State",
      landmark: "Near Golden Gate Restaurant",
      notes: null
    },
    items: [
      {
        id: "demo-item-11",
        deliveryId: "demo-6",
        foodItemId: "food-11",
        quantity: 2,
        unitPriceAtPurchase: 1500,
        foodItem: {
          name: "Watermelon Cubes",
          imageUrl: null,
          unit: "tub"
        }
      },
      {
        id: "demo-item-12",
        deliveryId: "demo-6",
        foodItemId: "food-12",
        quantity: 1,
        unitPriceAtPurchase: 2000,
        foodItem: {
          name: "Sliced Mangoes",
          imageUrl: null,
          unit: "tub"
        }
      }
    ]
  }
};

export function usePublicTracking(trackingCode: string | null) {
  const isDemoCode = trackingCode && DEMO_TRACKING[trackingCode];

  const { data: res, error: swrError, isLoading, mutate } = useSWR<{ data: PublicTrackingData | null; error: string | null }>(
    trackingCode && !isDemoCode ? `public-tracking-${trackingCode}` : null,
    () => nestTrailsApi.getPublicTracking(trackingCode!),
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 10000,
    }
  );

  if (isDemoCode) {
    return {
      trackingData: DEMO_TRACKING[trackingCode],
      isLoading: false,
      error: false,
      errorMsg: null,
      mutate: async () => undefined,
    };
  }

  const trackingData = res?.data ?? null;
  const error = swrError || res?.error;

  return {
    trackingData,
    isLoading,
    error: !!error,
    errorMsg: typeof error === "string" ? error : null,
    mutate,
  };
}
