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

export interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
  updatedAt?: string;
}

export interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  liveStatus?: LiveUserStatus;
  location?: UserLocation;
  maxDailyJobs?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type UpdateUserInput = Partial<Pick<UserRecord, "name" | "email" | "role" | "phone" | "avatar" | "liveStatus" | "location" | "maxDailyJobs">> & {
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

export async function updateUser(id: string, input: UpdateUserInput): Promise<UserRecord> {
  const { data } = await api.patch<UserRecord>(`/users/${id}`, input);
  return data;
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
