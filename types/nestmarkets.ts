// types/nestmarkets.ts

export type OrderStatus = "paid" | "delivered" | "accepted" | "rejected" | "pending";
export type TrackingStatus = "received" | "packaged" | "on_the_way" | "delivered";

export interface MarketStoreLite {
  id: string;
  name: string;
  logoUrl: string | null;
  averageRating: number;
  ratingCount?: number;
  isVerified?: boolean;
  status?: string;
}

export interface MarketProduct {
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
  store: MarketStoreLite;
}

export interface BrowseResponse {
  success: boolean;
  data: MarketProduct[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: MarketProduct;
}

export interface Cart {
  id: string;
  buyerId: string;
  items: CartItem[];
}

export interface CartResponse {
  success: boolean;
  data: Cart;
}

export interface CheckoutItem {
  productId: string;
  quantity: number;
}

export interface CheckoutRequest {
  items: CheckoutItem[];
  pin: string;
  deliveryProfileId: string;
}

export interface MarketOrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product: MarketProduct;
}

export interface MarketOrder {
  id: string;
  storeId: string;
  buyerId: string;
  totalAmount: number;
  deliveryFee: number;
  adminFee: number;
  sellerAmount: number;
  status: OrderStatus;
  trackingStatus: TrackingStatus;
  rejectionReason: string | null;
  addressSnapshot: Record<string, unknown> | null;
  createdAt: string;
  deliveredAt: string | null;
  acceptedAt: string | null;
  items: MarketOrderItem[];
  store: MarketStoreLite;
}

export interface MyOrdersResponse {
  success: boolean;
  data: MarketOrder[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface CheckoutResponse {
  success: boolean;
  message: string;
  data?: MarketOrder;
  shortfall?: number;
  requirePin?: boolean;
}
