import { api } from "./api";
import { LoginRequest, LoginResponse } from "@/types/auth";

export const authApi = {
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>("/api/auth/login", credentials).then(response => {
      // console.log("Login response:", JSON.stringify(response, null, 2));
      return response;
    }),

  socialLogin: (data: { provider: string; sessionToken: string; dataConsent: boolean }) =>
    api.post<LoginResponse>("/api/auth/social", data),

  register: (data: any) =>
    api.post<{ message: string; userId: string; token?: string }>("/api/auth/register", data),

  verify2FA: (data: { userId: string; code: string }) =>
    api.post<LoginResponse>("/api/auth/login/2fa", data).then(response => {
      // console.log("2FA verification response:", JSON.stringify(response, null, 2));
      return response;
    }),

  resend2FALogin: (data: { userId: string }) =>
    api.post<{ message: string }>("/api/auth/login/2fa/resend", data),

  logout: () => api.post("/api/auth/logout", {}),
  getProfile: () => api.get<{ 
    profile: any; 
    userId: string; 
    balance?: number; 
    recentActivity?: any[] 
  }>("/api/auth/profile"),

  updateProfile: (data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        if (Array.isArray(data[key])) {
          data[key].forEach((val) => formData.append(key, val));
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    return api.patch<{ message: string; profilePhoto?: string }>(
      "/api/auth/profile/setup",
      formData
    );
  },

  forgotPassword: (data: { email: string; frontendUrl?: string }) =>
    api.post<{ message: string }>("/api/auth/forgot-password", data),

  resetPassword: (data: { token: string; password: string }) =>
    api.post<{ message: string }>("/api/auth/reset-password", data),

  sendPhoneOtp: (data: { userId: string; phone: string }) =>
    api.post<{ message: string }>("/api/auth/phone/send-code", data),

  verifyPhoneOtp: (data: { userId: string; code: string }) =>
    api.post<{ message: string }>("/api/auth/phone/verify-code", data),

  setup2FA: (data: { userId: string; phone?: string; medium?: "email" | "phone" }) =>
    api.post<{ message: string }>("/api/auth/2fa/setup", data),

  verify2FASetup: (data: { userId: string; code: string }) =>
    api.post<{ message: string }>("/api/auth/2fa/verify", data),

  verifyAccount: (data: { userId: string; code: string }) =>
    api.post<{ message: string; token?: string }>("/api/auth/verify", data),

  resendVerification: (data: { userId: string }) =>
    api.post<{ message: string }>("/api/auth/resend-verification", data),

  disable2FA: (data: { userId: string; pin?: string }) =>
    api.post<{ message: string }>("/api/auth/2fa/disable", data),

  deleteAccount: (data: { userId: string }) =>
    api.delete<{ message: string; deletionScheduledAt: string }>("/api/auth/deleteUser", data),

  // NestPurse PIN Management
  setNestPursePin: (data: { newPin: string }) =>
    api.post<{ message: string }>("/api/nestpurse/set-pin", data),

  requestPinUpdateOtp: (data: { currentPin: string; otpMedium: "email" | "sms" }) =>
    api.post<{ message: string; sessionId: string; expiresIn: number }>(
      "/api/nestpurse/set-pin",
      data
    ),

  verifyPinUpdateOtp: (data: { sessionId: string; otp: string }) =>
    api.post<{ message: string }>("/api/nestpurse/set-pin", data),

  // Tier Upgrades
  upgradeTier2: (data: { id: string; isVirtual?: boolean }) =>
    api.post<{ message: string; tier: number }>("/api/auth/tier/upgrade/tier2", data),

  upgradeTier3: (data: { id: string }) =>
    api.post<{ message: string; tier: number }>("/api/auth/tier/upgrade/tier3", data),
};

