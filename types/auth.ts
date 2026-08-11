export interface User {
  userId: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requires2FA: boolean;
  pendingUserId: string | null;
  pendingPhone: string | null;
}

export interface LoginResponse {
  token?: string;
  tempToken?: string;
  userId: string;
  role?: string;
  requires2FA?: boolean;
  phone?: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password?: string;
}
