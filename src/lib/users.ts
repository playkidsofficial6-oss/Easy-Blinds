import { AxiosError } from "axios";
import { api } from "./api";
import type { UserRole } from "./auth";

export type LiveUserStatus =
  | "Available"
  | "On the way"
  | "In progress"
  | "Completed"
  | "Offline"
  | "Fully Booked";

/** GeoJSON Point as returned by the backend /users endpoint */
export interface UserLocation {
  type?: "Point";
  /** GeoJSON order: [longitude, latitude] */
  coordinates?: [number, number];
  /** Flat lat/lng fields (legacy fallback) */
  lat?: number;
  lng?: number;
  updatedAt?: string | Date;
}

/** Extract {lat, lng} from a UserLocation regardless of its format */
export function extractLatLng(location?: UserLocation | null): { lat: number; lng: number } | null {
  if (!location) return null;
  // GeoJSON coordinates: [longitude, latitude]
  if (Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    const lng = Number(location.coordinates[0]);
    const lat = Number(location.coordinates[1]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }
  // Flat lat/lng fallback
  if (location.lat !== undefined && location.lng !== undefined) {
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }
  return null;
}

export interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  location?: UserLocation;
  checkedIn?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type UpdateUserInput = Partial<Pick<UserRecord, "name" | "email" | "role" | "location" | "checkedIn">> & {
  password?: string;
};

type UsersListPayload = UserRecord[] | { items?: UserRecord[]; users?: UserRecord[]; data?: UserRecord[] };

function normalizeUsersPayload(payload: UsersListPayload): UserRecord[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.users)) return payload.users;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export async function getUsers(): Promise<UserRecord[]> {
  const { data } = await api.get<UsersListPayload>("/users");
  return normalizeUsersPayload(data);
}

export async function getUserById(id: string): Promise<UserRecord> {
  const { data } = await api.get<UserRecord | { user?: UserRecord; data?: UserRecord }>(`/users/${id}`);
  if ("user" in data && data.user) return data.user;
  if ("data" in data && data.data) return data.data;
  return data as UserRecord;
}

export async function updateUser(id: string, payload: UpdateUserInput): Promise<UserRecord> {
  const { data } = await api.patch<UserRecord | { user?: UserRecord; data?: UserRecord }>(`/users/${id}`, payload);
  if ("user" in data && data.user) return data.user;
  if ("data" in data && data.data) return data.data;
  return data as UserRecord;
}

export async function checkInUser(userId?: string): Promise<UserRecord> {
  const { data } = await api.post<UserRecord | { data: UserRecord }>("/users/checkin", userId ? { userId } : {});
  return (data as any).data || data;
}

export async function checkOutUser(userId?: string): Promise<UserRecord> {
  const { data } = await api.post<UserRecord | { data: UserRecord }>("/users/checkout", userId ? { userId } : {});
  return (data as any).data || data;
}

export function getUserErrorMessage(error: unknown, fallback = "Unable to load users from backend."): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(" ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
