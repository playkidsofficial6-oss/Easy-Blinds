import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export const AUTH_TOKEN_STORAGE_KEY = "easy-blinds-auth-token";
export const REFRESH_TOKEN_STORAGE_KEY = "easy-blinds-refresh-token";
export const AUTH_EXPIRED_EVENT = "easy-blinds-auth-expired";

export class ApiError extends Error {
  status?: number;
  payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

function addJwtToken(config: InternalAxiosRequestConfig) {
  const token = getStoredAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}

function resolveErrorMessage(error: AxiosError): string {
  const responseData = error.response?.data;

  if (
    responseData &&
    typeof responseData === "object" &&
    "message" in responseData
  ) {
    const message = (responseData as { message?: unknown }).message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return error.message || "Something went wrong while communicating with the API.";
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(addJwtToken);

// ─── Silent token refresh on 401 ────────────────────────────────
// Queues concurrent 401s so only one refresh call is made at a time.

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null) {
  for (const promise of failedQueue) {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  }
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;

    // Only attempt refresh on 401, and only once per request
    if (status === 401 && !originalRequest._retry) {
      const refreshToken = getStoredRefreshToken();

      // No refresh token available — go straight to logout
      if (!refreshToken) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
        }
        return Promise.reject(
          new ApiError(resolveErrorMessage(error), status, error.response?.data),
        );
      }

      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh endpoint directly (bypass interceptors to avoid loops)
        const { data } = await axios.post<{
          accessToken: string;
          refreshToken: string;
        }>(`${API_BASE_URL}/auth/refresh`, { refreshToken });

        // Persist new tokens
        window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.accessToken);
        window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);

        // Retry all queued requests with the new token
        processQueue(null, data.accessToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear everything and force re-login
        processQueue(refreshError, null);
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
        }

        return Promise.reject(
          new ApiError(resolveErrorMessage(error), status, error.response?.data),
        );
      } finally {
        isRefreshing = false;
      }
    }

    // Non-401 errors pass through normally
    return Promise.reject(
      new ApiError(resolveErrorMessage(error), status, error.response?.data),
    );
  },
);
