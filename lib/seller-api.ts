import { api } from "@/lib/api";
import type {
  SellerStoreResponse,
  SellerProductsResponse,
  SellerProductResponse,
  RequestVerificationBody,
} from "@/types/seller";

const BASE = "/api/nestmarkets";

export const sellerApi = {
  getMyStore: () => api.get<SellerStoreResponse>(`${BASE}/my-store`),
  createStore: (form: FormData) => api.post<SellerStoreResponse>(`${BASE}/create-store`, form),
  updateStore: (form: FormData) => api.put<SellerStoreResponse>(`${BASE}/my-store`, form),
  requestVerification: (body: RequestVerificationBody) =>
    api.post<SellerStoreResponse>(`${BASE}/request-verification`, body),

  getMyProducts: () => api.get<SellerProductsResponse>(`${BASE}/my-products`),
  createProduct: (form: FormData) => api.post<SellerProductResponse>(`${BASE}/products`, form),
  updateProduct: (id: string, form: FormData) =>
    api.put<SellerProductResponse>(`${BASE}/products/${id}`, form),
  deleteProduct: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`${BASE}/products/${id}`),
};
