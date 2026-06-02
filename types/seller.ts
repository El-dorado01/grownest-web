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
