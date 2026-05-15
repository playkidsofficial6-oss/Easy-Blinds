import { api } from "@/lib/api";

export type UserRole =
  | "admin"
  | "owner"
  | "sales_manager"
  | "salesman"
  | "field"
  | "fitter"
  | "stitching"
  | "user";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
  role?: UserRole;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function register(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function getProfile(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/profile");
  return data;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<AuthUser> {
  const { data } = await api.patch<AuthUser>("/auth/profile", payload);
  return data;
}
