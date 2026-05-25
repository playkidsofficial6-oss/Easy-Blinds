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

function getGeoJsonCoordinates(payload: BackendLiveLocationRecord) {
  let location = payload.location;
  if (typeof location === "string") {
    try { location = JSON.parse(location); } catch (e) {}
  }

  if (
    location?.type !== "Point" ||
    !Array.isArray(location.coordinates)
  ) {
    return null;
  }

  const [rawLng, rawLat] = location.coordinates;
  const latitude = Number(rawLat);
  const longitude = Number(rawLng);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  return { lat: latitude, lng: longitude };
}

export function normalizeLiveLocationRecord(
  payload: BackendLiveLocationRecord,
): LiveLocationRecord | null {
  const geoJsonCoordinates = getGeoJsonCoordinates(payload);
  const lat =
    geoJsonCoordinates?.lat ??
    (payload.lat !== undefined ? Number(payload.lat) : payload.latitude !== undefined ? Number(payload.latitude) : undefined);
  const lng =
    geoJsonCoordinates?.lng ??
    (payload.lng !== undefined ? Number(payload.lng) : payload.longitude !== undefined ? Number(payload.longitude) : undefined);

  const actualUserId = payload.userId || (payload.user as any)?._id || (payload.user as any)?.id || payload._id;

  if (lat === undefined || lng === undefined || Number.isNaN(lat) || Number.isNaN(lng) || !actualUserId) {
    console.warn("[LiveLocation] Failed to normalize record:", {
      lat, lng, actualUserId, payload
    });
    return null;
  }

  return {
    ...payload,
    userId: actualUserId,
    role: payload.role,
    liveStatus: payload.liveStatus ?? payload.status,
    status: payload.liveStatus ?? payload.status,
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
        liveLocations?: BackendLiveLocationRecord[];
        records?: BackendLiveLocationRecord[];
        data?: BackendLiveLocationRecord[];
      };

  const locations = Array.isArray(unwrapped)
    ? unwrapped
    : Array.isArray(unwrapped.items)
      ? unwrapped.items
      : Array.isArray(unwrapped.locations)
        ? unwrapped.locations
        : Array.isArray(unwrapped.liveLocations)
          ? unwrapped.liveLocations
          : Array.isArray(unwrapped.records)
            ? unwrapped.records
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
    location: {
      type: "Point",
      coordinates: [payload.lng, payload.lat],
    },
    accuracy: payload.accuracy,
    speed: payload.speed,
    heading: payload.heading,
    isOnline: payload.isOnline,
    liveStatus: payload.liveStatus,
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
