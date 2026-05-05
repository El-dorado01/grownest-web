import { api } from "./api";
import { LoginRequest, LoginResponse } from "@/types/auth";

export const authApi = {
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>("/api/auth/login", credentials),

  register: (data: any) =>
    api.post<{ message: string; userId: string }>("/api/auth/register", data),

  verify2FA: (data: { userId: string; code: string }) =>
    api.post<LoginResponse>("/api/auth/verify-2fa", data),

  logout: () => api.post("/api/auth/logout", {}),
  getProfile: () => api.get<{ 
    profile: any; 
    userId: string; 
    balance?: number; 
    recentActivity?: any[] 
  }>("/api/auth/profile"),
};
