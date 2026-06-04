// types/seller.ts

export interface SellerStore {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  isVerified: boolean;
  status: string; // "pending" | "active" | "inactive"
  latitude: number | null;
  longitude: number | null;
  averageRating: number;
  ratingCount: number;
  businessAddress: string | null;
  cacNumber: string | null;
  verificationRequestedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
  pendingBalance?: number;
  totalEarned?: number;
}

export interface SellerStoreResponse {
  success: boolean;
  data: SellerStore;
  message?: string;
}

export interface SellerProduct {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string | null;
  stockLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerProductsResponse {
  success: boolean;
  data: SellerProduct[];
}

export interface SellerProductResponse {
  success: boolean;
  data: SellerProduct;
  message?: string;
}

export interface RequestVerificationBody {
  businessAddress: string;
  cacNumber?: string;
}

export type TrackingStatus = "received" | "packaged" | "on_the_way" | "delivered";

export interface SellerOrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product: { id: string; name: string; imageUrl: string | null } | null;
}

export interface SellerOrder {
  id: string;
  buyerId: string;
  storeId: string;
  totalAmount: number;
  deliveryFee: number;
  adminFee: number;
  sellerAmount: number;
  status: string; // paid | delivered | accepted | rejected
  trackingStatus: TrackingStatus;
  addressSnapshot: Record<string, unknown> | null;
  payoutStatus: string;
  rejectionReason: string | null;
  createdAt: string;
  deliveredAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  items: SellerOrderItem[];
}

export interface SellerTransactionsResponse {
  success: boolean;
  data: SellerOrder[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface UpdateTrackingResponse {
  success: boolean;
  data: SellerOrder;
}
