import { api } from "@/lib/api";

export enum UserRole {
  Admin = "Admin",
  Owner = "Owner",
  SalesManager = "Sales Manager",
  Salesman = "Salesman",
  Field = "Field",
  Fitter = "Fitter",
  Stitching = "Stitching",
  User = "User",
}

export function isSalesmanRole(role?: UserRole | string | null): boolean {
  return role === UserRole.Salesman;
}

export function isFitterRole(role?: UserRole | string | null): boolean {
  return role === UserRole.Fitter;
}

export function isSalesManagerRole(role?: UserRole | string | null): boolean {
  return role === UserRole.SalesManager;
}

export function isAdminRole(role?: UserRole | string | null): boolean {
  return role === UserRole.Admin;
}

export function isOwnerRole(role?: UserRole | string | null): boolean {
  return role === UserRole.Owner;
}

export function isFieldRole(role?: UserRole | string | null): boolean {
  return role === UserRole.Field;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phoneNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
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

