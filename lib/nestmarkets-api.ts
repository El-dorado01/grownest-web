import { api } from "@/lib/api";
import type {
  BrowseResponse,
  CartResponse,
  CheckoutRequest,
  CheckoutResponse,
  MyOrdersResponse,
  StoresResponse,
  StoreResponse,
  FollowResponse,
  StoreReviewsResponse,
  ChatThreadsResponse,
  ChatThreadResponse,
  SendMessageResponse,
} from "@/types/nestmarkets";

const BASE = "/api/nestmarkets";
const CHAT = "/api/nestmarkets/chat";

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

  // Vendors / discovery
  getStores: () => api.get<StoresResponse>(`${BASE}/stores`),
  getStore: (id: string) => api.get<StoreResponse>(`${BASE}/stores/${id}`),
  topRated: (limit = 10) => api.get<StoresResponse>(`${BASE}/recommendations/top-rated?limit=${limit}`),
  nearby: (lat: number, lon: number, limit = 20) =>
    api.get<StoresResponse>(`${BASE}/recommendations/nearby?lat=${lat}&lon=${lon}&limit=${limit}`),

  // Follow
  followStore: (id: string) => api.post<FollowResponse>(`${BASE}/stores/${id}/follow`),
  getFollowedStores: () => api.get<StoresResponse>(`${BASE}/followed-stores`),

  // Reviews / rating
  getStoreReviews: (id: string, page = 1, limit = 10) =>
    api.get<StoreReviewsResponse>(`${BASE}/stores/${id}/reviews?page=${page}&limit=${limit}`),
  rateOrder: (id: string, rating: number, review?: string) =>
    api.post<{ success: boolean; message: string }>(`${BASE}/orders/${id}/rate`, { rating, review }),

  // Chat
  getChatThreads: () => api.get<ChatThreadsResponse>(`${CHAT}/threads`),
  getChatThread: (id: string) => api.get<ChatThreadResponse>(`${CHAT}/threads/${id}`),
  sendChatMessage: (id: string, content: string) =>
    api.post<SendMessageResponse>(`${CHAT}/threads/${id}/messages`, { content }),
  markThreadRead: (id: string) =>
    api.post<{ success: boolean }>(`${CHAT}/threads/${id}/read`),
};
