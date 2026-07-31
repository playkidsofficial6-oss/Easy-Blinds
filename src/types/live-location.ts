import type { AuthUser, UserRole } from "@/lib/auth";

export type LiveLocationRole = UserRole.Salesman | UserRole.Fitter | "Salesman" | "Fitter" | "salesman" | "fitter" | "SALESMAN" | "FITTER";

export interface LiveLocationCoordinates {
  lat: number;
  lng: number;
}

export interface GeoJsonPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface BackendLiveLocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface BackendGeoJsonLiveLocationCoordinates {
  location: GeoJsonPoint;
}

export interface UpdateLiveLocationPayload extends LiveLocationCoordinates {}

export type BackendUpdateLiveLocationPayload = BackendGeoJsonLiveLocationCoordinates &
  Partial<BackendLiveLocationCoordinates> &
  Omit<UpdateLiveLocationPayload, keyof LiveLocationCoordinates>;

export interface LiveLocationRecord extends LiveLocationCoordinates {
  _id?: string;
  userId: string;
  user?: AuthUser;
  role: LiveLocationRole;
  createdAt?: string;
  updatedAt?: string;
}

export type BackendLiveLocationRecord = Omit<LiveLocationRecord, keyof LiveLocationCoordinates> &
  Partial<LiveLocationCoordinates> &
  Partial<BackendLiveLocationCoordinates> &
  Partial<BackendGeoJsonLiveLocationCoordinates>;

export interface ApiResponseEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

export type LiveLocationListPayload =
  | LiveLocationRecord[]
  | BackendLiveLocationRecord[]
  | ApiResponseEnvelope<BackendLiveLocationRecord[]>
  | {
      items?: BackendLiveLocationRecord[];
      locations?: BackendLiveLocationRecord[];
      data?: BackendLiveLocationRecord[];
    };

export type LiveLocationPayload =
  | LiveLocationRecord
  | BackendLiveLocationRecord
  | ApiResponseEnvelope<BackendLiveLocationRecord>;

export interface LiveLocationUpdatedEvent {
  location?: BackendLiveLocationRecord;
  data?: BackendLiveLocationRecord;
}

export interface LiveLocationPresenceEvent {
  userId: string;
  role?: LiveLocationRole;
  timestamp?: string;
  location?: BackendLiveLocationRecord;
}

export interface LiveLocationSocketListeners {
  onLocationUpdated?: (location: LiveLocationRecord) => void;
  onUserOnline?: (event: LiveLocationPresenceEvent) => void;
  onUserOffline?: (event: LiveLocationPresenceEvent) => void;
  onSalesmanStatusChanged?: (event: { userId: string; status: string; role: string; jobId?: string }) => void;
  onJobUpdated?: (job: any) => void;
  onJobDeleted?: (payload: { id: string; jobId?: string }) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}
