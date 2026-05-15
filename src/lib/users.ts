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

export async function getUsers(): Promise<UserRecord[]> {
  const { data } = await api.get<UserRecord[]>("/users");
  return data;
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
