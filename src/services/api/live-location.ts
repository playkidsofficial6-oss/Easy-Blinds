import { apiClient } from "./axios";
import type {
  LiveLocationListPayload,
  LiveLocationRecord,
  UpdateLiveLocationPayload,
} from "@/types/live-location";

function normalizeLiveLocationList(
  payload: LiveLocationListPayload,
): LiveLocationRecord[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.locations)) return payload.locations;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export async function updateLiveLocation(
  payload: UpdateLiveLocationPayload,
): Promise<LiveLocationRecord> {
  const { data } = await apiClient.post<LiveLocationRecord>(
    "/live-location/update",
    payload,
  );

  return data;
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
  const { data } = await apiClient.get<LiveLocationRecord>(
    `/live-location/${userId}`,
  );

  return data;
}
