import { api } from "@/lib/api";
import type {
  BrowseResponse,
  CartResponse,
  CheckoutRequest,
  CheckoutResponse,
  MyOrdersResponse,
} from "@/types/nestmarkets";

const BASE = "/api/nestmarkets";

export const nestMarketsApi = {
  browse: (params: { search?: string; category?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.category) q.set("category", params.category);
    q.set("page", String(params.page ?? 1));
    q.set("limit", String(params.limit ?? 10));
    return api.get<BrowseResponse>(`${BASE}/browse?${q.toString()}`);
  },

  getCart: () => api.get<CartResponse>(`${BASE}/cart`),
  addCartItem: (productId: string, quantity: number) =>
    api.post<CartResponse>(`${BASE}/cart/items`, { productId, quantity }),
  updateCartItem: (id: string, quantity: number) =>
    api.patch<CartResponse>(`${BASE}/cart/items/${id}`, { quantity }),
  removeCartItem: (id: string) => api.delete<CartResponse>(`${BASE}/cart/items/${id}`),
  clearStoreFromCart: (storeId: string) =>
    api.delete<CartResponse>(`${BASE}/cart?storeId=${storeId}`),

  checkout: (data: CheckoutRequest) => api.post<CheckoutResponse>(`${BASE}/checkout`, data),

  myOrders: (page = 1, limit = 10) =>
    api.get<MyOrdersResponse>(`${BASE}/my-orders?page=${page}&limit=${limit}`),
  acceptOrder: (id: string) =>
    api.post<{ success: boolean; message: string }>(`${BASE}/orders/${id}/accept`),
  rejectOrder: (id: string, reason: string) =>
    api.post<{ success: boolean; message: string }>(`${BASE}/orders/${id}/reject`, { reason }),
};
