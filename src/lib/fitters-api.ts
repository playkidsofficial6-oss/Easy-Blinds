import { api } from "./api";
import type { UserRecord, UserLocation } from "./users";

export enum FitterProfileStatus {
  Available = "Available",
  OnTheWay = "On The Way",
  InProgress = "In Progress",
  FullyBooked = "Fully Booked",
}

export interface FitterProfileRecord {
  _id?: string;
  userId: string;
  user: UserRecord;
  phoneNumber?: string;
  location?: UserLocation;
  status: FitterProfileStatus;
  capacity: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

type FittersListPayload = FitterProfileRecord[] | { items?: FitterProfileRecord[]; fitters?: FitterProfileRecord[]; data?: FitterProfileRecord[] };

function normalizeFittersPayload(payload: FittersListPayload): FitterProfileRecord[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.fitters)) return payload.fitters;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export async function getFitters(): Promise<FitterProfileRecord[]> {
  const { data } = await api.get<FittersListPayload>("/users/fitters");
  return normalizeFittersPayload(data);
}
