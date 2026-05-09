// API Configuration and Base Fetch Client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface FetchOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
  tags?: string[];
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Get the auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

/**
 * Get the temp token (for 2FA flow)
 */
export function getTempToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("temp_token");
}

/**
 * Set auth tokens in localStorage and cookie (for middleware)
 */
export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
    // Also set as cookie for middleware
    document.cookie = `auth_token=${token}; path=/; max-age=${
      60 * 60 * 24
    }; SameSite=Lax`;
  }
}

export function setTempToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("temp_token", token);
  }
}

/**
 * Clear all auth tokens
 */
export function clearAuthTokens(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("temp_token");
    localStorage.removeItem("user");
    // Also clear cookie
    document.cookie = "auth_token=; path=/; max-age=0";
  }
}

/**
 * Base API fetch function with automatic auth header injection
 */
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {}, cache, tags } = options;

  const token = getAuthToken();
  const tempToken = getTempToken();

  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  // Only set Content-Type if not FormData (browser sets it for FormData)
  if (!(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  // Add auth token if available
  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  } else if (tempToken) {
    requestHeaders["Authorization"] = `Bearer ${tempToken}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  // Pre-fetch check for connectivity
  if (typeof window !== "undefined" && !navigator.onLine) {
    return {
      data: null,
      error: "No internet connection. Please check your network.",
      status: 0,
    };
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      cache,
      next: tags ? { tags } : undefined,
    } as RequestInit);

    const text = await response.text();
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("[API] Response is not JSON:", text.substring(0, 100));
      return {
        data: null,
        error: "Server returned invalid response",
        status: response.status,
      };
    }

    // 401 → session expired, clear tokens and redirect to login
    if (response.status === 401) {
      if (typeof window !== "undefined" && getAuthToken()) {
        clearAuthTokens();
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
      return {
        data: null,
        error: data.error || "Session expired. Please log in again.",
        status: 401,
      };
    }

    if (!response.ok) {
      // Handle Zod validation errors specifically
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        return {
          data: null,
          error: data.errors[0].message || "Validation failed",
          status: response.status,
        };
      }

      return {
        data: null,
        error: data.error || data.message || "An error occurred",
        status: response.status,
      };
    }

    // if (endpoint.includes("/api/nesteggs/group")) {
    //   console.log(`[group-api] ${method} ${endpoint}`, JSON.stringify(data, null, 2))
    // }

    return {
      data: data as T,
      error: null,
      status: response.status,
    };
  } catch (error) {
    console.error("[API] Fetch Error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Network error",
      status: 0,
    };
  }
}

/**
 * API helper methods
 */
export const api = {
  get: <T>(endpoint: string, options?: Omit<FetchOptions, "method" | "body">) =>
    apiFetch<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<FetchOptions, "method" | "body">
  ) => apiFetch<T>(endpoint, { ...options, method: "POST", body }),

  put: <T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<FetchOptions, "method" | "body">
  ) => apiFetch<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<FetchOptions, "method" | "body">
  ) => apiFetch<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<FetchOptions, "method" | "body">
  ) => apiFetch<T>(endpoint, { ...options, method: "DELETE", body }),
};

export default api;
