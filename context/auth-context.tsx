"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  getAuthToken,
  setAuthToken,
  setTempToken,
  clearAuthTokens,
} from "@/lib/api";
import { authApi } from "@/lib/auth-api";
import type { User, AuthState, LoginRequest } from "@/types/auth";
import { toast } from "sonner";

interface AuthContextValue extends AuthState {
  login: (
    credentials: LoginRequest
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    data: any
  ) => Promise<{ success: boolean; error?: string }>;
  verify2FA: (code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    requires2FA: false,
    pendingUserId: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        if (isTokenExpired(token)) {
          clearAuthTokens();
          setState((prev) => ({ ...prev, isLoading: false }));
          return;
        }
        try {
          const user = JSON.parse(storedUser) as User;
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            requires2FA: false,
            pendingUserId: null,
          });
        } catch {
          clearAuthTokens();
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    checkAuth();
  }, []);

  const handleIdleLogout = useCallback(() => {
    if (!state.isAuthenticated) return;
    
    clearAuthTokens();
    localStorage.removeItem("user");
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      requires2FA: false,
      pendingUserId: null,
    });
    toast.info("Logged out due to inactivity.");
    authApi.logout().catch(() => {});
    router.push("/login");
  }, [router, state.isAuthenticated]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(handleIdleLogout, IDLE_TIMEOUT_MS);
  }, [handleIdleLogout]);

  useEffect(() => {
    if (!state.isAuthenticated) return;

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer));
    resetIdleTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [state.isAuthenticated, resetIdleTimer]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { data, error } = await authApi.login(credentials);

      if (error || !data) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: error || "Login failed" };
      }

      if (data.requires2FA && data.tempToken) {
        setTempToken(data.tempToken);
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          requires2FA: true,
          pendingUserId: data.userId,
        });
        router.push("/login/verify");
        return { success: true };
      }

      if (data.token) {
        setAuthToken(data.token);
        const user: User = {
          userId: data.userId,
          role: data.role,
          email: credentials.email,
        };
        localStorage.setItem("user", JSON.stringify(user));

        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          requires2FA: false,
          pendingUserId: null,
        });

        // Redirect is handled by the calling component
        return { success: true };
      }

      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: "Unexpected response from server" };
    },
    [router]
  );

  const register = useCallback(
    async (regData: any) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      const { data, error } = await authApi.register(regData);
      setState((prev) => ({ ...prev, isLoading: false }));

      if (error) {
        return { success: false, error };
      }
      
      return { success: true };
    },
    []
  );

  const verify2FA = useCallback(
    async (code: string) => {
      if (!state.pendingUserId) {
        return { success: false, error: "No pending 2FA verification" };
      }

      setState((prev) => ({ ...prev, isLoading: true }));

      const { data, error } = await authApi.verify2FA({
        userId: state.pendingUserId,
        code,
      });

      if (error || !data) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: error || "Verification failed" };
      }

      localStorage.removeItem("temp_token");
      if (data.token) {
        setAuthToken(data.token);
      }

      const user: User = {
        userId: data.userId,
        role: data.role,
      };
      localStorage.setItem("user", JSON.stringify(user));

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        requires2FA: false,
        pendingUserId: null,
      });

      toast.success("2FA verification successful");
      window.location.href = "/";
      return { success: true };
    },
    [state.pendingUserId, router]
  );

  const logout = useCallback(async () => {
    const loadingToastId = toast.loading("Logging out...");
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout Error", error);
    } finally {
      clearAuthTokens();
      localStorage.removeItem("user");
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        requires2FA: false,
        pendingUserId: null,
      });
      toast.dismiss(loadingToastId);
      toast.success("Logged out successfully");
      router.push("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        verify2FA,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
