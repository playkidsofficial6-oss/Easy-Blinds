"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AUTH_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  api,
} from "@/lib/api";
import {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  getProfile,
  login as loginRequest,
  register as registerRequest,
} from "@/lib/auth";
import { checkOutUser } from "@/lib/users";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  refreshProfile: () => Promise<AuthUser | null>;
  logout: (redirectTo?: string) => Promise<void> | void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistSession(response: AuthResponse): void {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, response.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, response.refreshToken);
}

function clearSession(): void {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(
    async (redirectTo = "/login") => {
      try {
        // Automatically check out user on backend before clearing tokens
        await checkOutUser().catch(() => {});
        await api.post("/auth/logout").catch(() => {});
      } catch {
        // Ignore errors — we're logging out anyway
      } finally {
        clearSession();
        setToken(null);
        setUser(null);
        router.replace(redirectTo);
      }
    },
    [router],
  );

  const refreshProfile = useCallback(async () => {
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return null;
    }

    try {
      setToken(storedToken);
      const profile = await getProfile();
      setUser(profile);
      return profile;
    } catch {
      clearSession();
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    const handleExpiredSession = () => {
      toast.error("Your session has expired. Please sign in again.");
      clearSession();
      setToken(null);
      setUser(null);
      router.replace("/login");
    };

    window.addEventListener("easy-blinds-auth-expired", handleExpiredSession);

    return () => {
      window.removeEventListener(
        "easy-blinds-auth-expired",
        handleExpiredSession,
      );
    };
  }, [router]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginRequest(payload);
    persistSession(response);
    setToken(response.accessToken);
    setUser(response.user);
    return response;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await registerRequest(payload);
    persistSession(response);
    setToken(response.accessToken);
    setUser(response.user);
    return response;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      refreshProfile,
      logout,
    }),
    [user, token, isLoading, login, register, refreshProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
