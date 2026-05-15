import { apiClient } from "./axios";
import type {
  ApiResponseEnvelope,
  BackendLiveLocationRecord,
  BackendUpdateLiveLocationPayload,
  LiveLocationListPayload,
  LiveLocationPayload,
  LiveLocationRecord,
  UpdateLiveLocationPayload,
} from "@/types/live-location";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function unwrapApiEnvelope<T>(payload: T | ApiResponseEnvelope<T>): T {
  if (isRecord(payload) && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}

export function normalizeLiveLocationRecord(
  payload: BackendLiveLocationRecord,
): LiveLocationRecord | null {
  const lat = typeof payload.lat === "number" ? payload.lat : payload.latitude;
  const lng = typeof payload.lng === "number" ? payload.lng : payload.longitude;

  if (typeof lat !== "number" || typeof lng !== "number" || !payload.userId) {
    return null;
  }

  return {
    ...payload,
    userId: payload.userId,
    role: payload.role,
    lat,
    lng,
    isOnline: payload.isOnline ?? true,
    lastUpdatedAt: payload.lastUpdatedAt,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
}

function normalizeLiveLocationPayload(
  payload: LiveLocationPayload,
): LiveLocationRecord {
  const unwrapped = unwrapApiEnvelope(payload) as BackendLiveLocationRecord;
  const location = normalizeLiveLocationRecord(unwrapped);

  if (!location) {
    throw new Error("Live-location response did not include valid coordinates.");
  }

  return location;
}

function normalizeLiveLocationList(
  payload: LiveLocationListPayload,
): LiveLocationRecord[] {
  const unwrapped = unwrapApiEnvelope(payload) as
    | BackendLiveLocationRecord[]
    | {
        items?: BackendLiveLocationRecord[];
        locations?: BackendLiveLocationRecord[];
        data?: BackendLiveLocationRecord[];
      };

  const locations = Array.isArray(unwrapped)
    ? unwrapped
    : Array.isArray(unwrapped.items)
      ? unwrapped.items
      : Array.isArray(unwrapped.locations)
        ? unwrapped.locations
        : Array.isArray(unwrapped.data)
          ? unwrapped.data
          : [];

  return locations
    .map((location) => normalizeLiveLocationRecord(location))
    .filter((location): location is LiveLocationRecord => Boolean(location));
}

function toBackendUpdatePayload(
  payload: UpdateLiveLocationPayload,
): BackendUpdateLiveLocationPayload {
  return {
    latitude: payload.lat,
    longitude: payload.lng,
    accuracy: payload.accuracy,
    speed: payload.speed,
    heading: payload.heading,
    isOnline: payload.isOnline,
  };
}

export async function updateLiveLocation(
  payload: UpdateLiveLocationPayload,
): Promise<LiveLocationRecord> {
  const { data } = await apiClient.post<LiveLocationPayload>(
    "/live-location/update",
    toBackendUpdatePayload(payload),
  );

  return normalizeLiveLocationPayload(data);
}

export async function getAllLiveLocations(): Promise<LiveLocationRecord[]> {
  const { data } = await apiClient.get<LiveLocationListPayload>(
    "/live-location/all",
  );

  return normalizeLiveLocationList(data);
}

export async function getUserLocation(
  userId: string,
): Promise<LiveLocationRecord> {
  const { data } = await apiClient.get<LiveLocationPayload>(
    `/live-location/${userId}`,
  );

  return normalizeLiveLocationPayload(data);
}
