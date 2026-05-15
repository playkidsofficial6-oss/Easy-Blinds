import type { AuthUser, UserRole } from "@/lib/auth";

export type LiveLocationRole = Extract<UserRole, "salesman" | "fitter"> | "SALESMAN" | "FITTER";

export interface LiveLocationCoordinates {
  lat: number;
  lng: number;
}

export interface UpdateLiveLocationPayload extends LiveLocationCoordinates {
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface LiveLocationRecord extends LiveLocationCoordinates {
  _id?: string;
  userId: string;
  user?: AuthUser;
  role: LiveLocationRole;
  accuracy?: number;
  speed?: number;
  heading?: number;
  isOnline: boolean;
  lastUpdatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type LiveLocationListPayload =
  | LiveLocationRecord[]
  | {
      items?: LiveLocationRecord[];
      locations?: LiveLocationRecord[];
      data?: LiveLocationRecord[];
    };

export interface LiveLocationUpdatedEvent {
  location: LiveLocationRecord;
}

export interface LiveLocationPresenceEvent {
  userId: string;
  role?: LiveLocationRole;
  isOnline?: boolean;
  timestamp?: string;
  location?: LiveLocationRecord;
}

export interface LiveLocationSocketListeners {
  onLocationUpdated?: (location: LiveLocationRecord) => void;
  onUserOnline?: (event: LiveLocationPresenceEvent) => void;
  onUserOffline?: (event: LiveLocationPresenceEvent) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}
