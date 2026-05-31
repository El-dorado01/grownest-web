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
  rating?: { id: string; rating: number; review: string | null } | null;
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

export interface MarketStore {
  id: string;
  ownerId?: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  averageRating: number;
  ratingCount: number;
  latitude: number | null;
  longitude: number | null;
  businessAddress: string | null;
  isVerified: boolean;
  status: string;
  distance?: number;
  _count?: { products: number; followers: number };
  products?: MarketProduct[];
}

export interface StoresResponse {
  success: boolean;
  data: MarketStore[];
  total?: number;
}

export interface StoreResponse {
  success: boolean;
  data: MarketStore;
}

export interface FollowResponse {
  success: boolean;
  message: string;
  followed: boolean;
}

export interface MarketReview {
  id: string;
  orderId: string;
  storeId: string;
  rating: number;
  review: string | null;
  createdAt: string;
  buyer: { fullName: string | null; profilePhoto: string | null };
}

export interface StoreReviewsResponse {
  success: boolean;
  data: MarketReview[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface ChatLastMessage {
  id: string;
  content: string;
  senderId: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatThreadSummary {
  id: string;
  orderId: string | null;
  buyerId: string;
  storeId: string;
  updatedAt: string;
  store: { name: string; logoUrl: string | null; ownerId: string };
  buyer: { fullName: string | null; profilePhoto: string | null };
  order: { id: string; status: string } | null;
  messages: ChatLastMessage[]; // [lastMessage] or []
  unreadCount: number;
}

export interface ChatThreadsResponse {
  success: boolean;
  data: ChatThreadSummary[];
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { fullName: string | null; profilePhoto: string | null };
  isSender: boolean;
}

export interface ChatThreadDetail {
  id: string;
  orderId: string | null;
  buyerId: string;
  storeId: string;
  updatedAt: string;
  store?: { name?: string; logoUrl?: string | null; ownerId: string };
  order?: { id: string; status: string } | null;
  messages: ChatMessage[];
}

export interface ChatThreadResponse {
  success: boolean;
  data: ChatThreadDetail;
}

export interface SendMessageResponse {
  success: boolean;
  data?: ChatMessage;
  message?: string;
  moderated?: boolean;
}
