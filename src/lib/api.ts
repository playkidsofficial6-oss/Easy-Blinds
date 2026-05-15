import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export const AUTH_TOKEN_STORAGE_KEY = "easy-blinds-auth-token";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      window.dispatchEvent(new Event("easy-blinds-auth-expired"));
    }

    return Promise.reject(error);
  },
);
