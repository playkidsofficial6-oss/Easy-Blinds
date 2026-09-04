import { io, type Socket } from "socket.io-client";

import { getStoredAuthToken, updateLiveLocation } from "@/services/api";
import { normalizeLiveLocationRecord } from "@/services/api/live-location";
import { logDiagnostic } from "./diagnostics";
import type {
  BackendLiveLocationRecord,
  LiveLocationPresenceEvent,
  LiveLocationRecord,
  LiveLocationSocketListeners,
  LiveLocationUpdatedEvent,
  UpdateLiveLocationPayload,
} from "@/types/live-location";
import {
  LIVE_LOCATION_SOCKET_URL,
  SOCKET_RECONNECTION_CONFIG,
} from "./config";

let liveLocationSocket: Socket | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// The backend gateway broadcasts this exact shape on location:updated:
// { userId, role, location: { type: "Point", coordinates: [lng, lat] },
//   latitude, longitude }
function resolveLocationPayload(
  payload: BackendLiveLocationRecord | LiveLocationUpdatedEvent,
): LiveLocationRecord | null {
  if (!isRecord(payload)) return null;

  // Shape 1: Direct gateway broadcast — has top-level userId + location GeoJSON
  // This is the most common case from broadcastLocationUpdated()
  if ("userId" in payload && "location" in payload) {
    return normalizeLiveLocationRecord(payload as unknown as BackendLiveLocationRecord);
  }

  // Shape 2: Wrapped in { location: <record> } where location has userId
  if ("location" in payload) {
    const nestedLocation = payload.location;
    if (isRecord(nestedLocation) && "userId" in nestedLocation) {
      return normalizeLiveLocationRecord(
        nestedLocation as unknown as BackendLiveLocationRecord,
      );
    }
  }

  // Shape 3: Wrapped in { data: <record> }
  if ("data" in payload) {
    return normalizeLiveLocationRecord(payload.data as BackendLiveLocationRecord);
  }

  // Shape 4: Plain record
  return normalizeLiveLocationRecord(payload as BackendLiveLocationRecord);
}

function normalizePresencePayload(
  payload: LiveLocationPresenceEvent,
): LiveLocationPresenceEvent {
  return {
    ...payload,
  };
}

export function getLiveLocationSocket(): Socket | null {
  return liveLocationSocket;
}

export function connectSocket(token = getStoredAuthToken()): Socket | null {
  if (typeof window === "undefined") {
    return null;
  }

  const effectiveToken = token || getStoredAuthToken();
  if (!effectiveToken) {
    return null;
  }

  if (liveLocationSocket) {
    const currentAuth = liveLocationSocket.auth as { token?: string } | undefined;
    if (currentAuth?.token && currentAuth.token !== effectiveToken) {
      // Token changed, update auth and reconnect
      liveLocationSocket.auth = { token: effectiveToken };
      if (liveLocationSocket.connected) {
        liveLocationSocket.disconnect();
      }
      liveLocationSocket.connect();
    } else if (!liveLocationSocket.connected) {
      liveLocationSocket.connect();
    }
    return liveLocationSocket;
  }

  console.log("[LiveLocation Socket] Connecting to:", LIVE_LOCATION_SOCKET_URL);
  console.log("[LiveLocation Socket] Token present:", !!effectiveToken);

  liveLocationSocket = io(LIVE_LOCATION_SOCKET_URL, {
    ...SOCKET_RECONNECTION_CONFIG,
    auth: { token: effectiveToken },
    query: { token: effectiveToken },
    autoConnect: true,
    // WebSocket preferred on pure VPS setup
    transports: ["websocket", "polling"],
    forceNew: false,
  });

  liveLocationSocket.on("connect", () => {
    console.log("[LiveLocation Socket] ✅ Connected! Socket ID:", liveLocationSocket?.id);
  });

  liveLocationSocket.on("connect_error", (err) => {
    console.error("[LiveLocation Socket] ❌ Connection error:", err.message);
  });

  liveLocationSocket.on("disconnect", (reason) => {
    console.warn("[LiveLocation Socket] ⚠️ Disconnected:", reason);
  });

  liveLocationSocket.on("location:updated", (data) => {
    console.log("[LiveLocation Socket] 📍 Location update received:", data);
  });

  return liveLocationSocket;
}

export function disconnectSocket(): void {
  if (!liveLocationSocket) {
    return;
  }

  liveLocationSocket.removeAllListeners();
  liveLocationSocket.disconnect();
  liveLocationSocket = null;
}

export function listenToLocationUpdates(
  listeners: LiveLocationSocketListeners,
  token?: string,
): () => void {
  const socket = connectSocket(token || getStoredAuthToken());

  if (!socket) {
    return () => undefined;
  }

  const handleLocationUpdated = (
    payload: BackendLiveLocationRecord | LiveLocationUpdatedEvent,
  ) => {
    const location = resolveLocationPayload(payload);

    if (location) {
      listeners.onLocationUpdated?.(location);
    }
  };

  const handleUserOnline = (payload: LiveLocationPresenceEvent) => {
    listeners.onUserOnline?.(normalizePresencePayload(payload));
  };

  const handleUserOffline = (payload: LiveLocationPresenceEvent) => {
    listeners.onUserOffline?.(normalizePresencePayload(payload));
  };

  const handleSalesmanStatusChanged = (payload: { userId: string; status: string; role: string; jobId?: string }) => {
    listeners.onSalesmanStatusChanged?.(payload);
  };

  const handleJobUpdated = (payload: any) => {
    listeners.onJobUpdated?.(payload);
  };

  const handleJobDeleted = (payload: { id: string; jobId?: string }) => {
    listeners.onJobDeleted?.(payload);
  };

  const handleConnect = () => {
    listeners.onConnect?.();
  };

  const handleDisconnect = (reason: string) => {
    listeners.onDisconnect?.(reason);
  };

  const handleError = (error: Error) => {
    listeners.onError?.(error);
  };

  socket.on("location:updated", handleLocationUpdated);
  socket.on("user:online", handleUserOnline);
  socket.on("user:offline", handleUserOffline);
  socket.on("salesman:status-changed", handleSalesmanStatusChanged);
  socket.on("job:updated", handleJobUpdated);
  socket.on("job:deleted", handleJobDeleted);
  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  socket.on("connect_error", handleError);
  socket.on("exception", handleError);

  return () => {
    socket.off("location:updated", handleLocationUpdated);
    socket.off("user:online", handleUserOnline);
    socket.off("user:offline", handleUserOffline);
    socket.off("salesman:status-changed", handleSalesmanStatusChanged);
    socket.off("job:updated", handleJobUpdated);
    socket.off("job:deleted", handleJobDeleted);
    socket.off("connect", handleConnect);
    socket.off("disconnect", handleDisconnect);
    socket.off("connect_error", handleError);
    socket.off("exception", handleError);
  };
}

export async function emitLocationUpdate(
  payload: UpdateLiveLocationPayload,
): Promise<LiveLocationRecord> {
  const socket = connectSocket();

  if (!socket || !socket.connected) {
    throw new Error("Socket not connected");
  }

  const backendPayload = {
    location: {
      type: "Point",
      coordinates: [payload.lng, payload.lat],
    },
  };

  return new Promise<LiveLocationRecord>((resolve, reject) => {
    socket.emit("location:update", backendPayload, (ack: any) => {
      const isError =
        ack?.success === false ||
        ack?.error ||
        ack?.status === "error" ||
        ack?.status === "ERROR";

      if (isError) {
        reject(new Error(
          ack?.message || ack?.error || "Failed to update location via socket"
        ));
        return;
      }

      const responseData = ack?.data || ack;
      const normalized = responseData
        ? normalizeLiveLocationRecord(responseData)
        : null;

      if (normalized) {
        resolve(normalized);
      } else {
        resolve({
          userId: "unknown",
          role: "salesman",
          status: "Available",
          lat: payload.lat,
          lng: payload.lng,
          updatedAt: new Date().toISOString(),
        } as LiveLocationRecord);
      }
    });
  });
}

export async function sendLiveLocationUpdate(
  payload: UpdateLiveLocationPayload,
): Promise<LiveLocationRecord> {
  const socket = getLiveLocationSocket();
  if (socket?.connected) {
    try {
      const record = await emitLocationUpdate(payload);
      logDiagnostic("SOCKET", `Location update emitted successfully via Socket.IO`, payload);
      return record;
    } catch (error) {
      logDiagnostic("ERROR", `Socket.IO emit failed, falling back to HTTP: ${(error as any).message}`, error);
    }
  }

  try {
    const record = await updateLiveLocation(payload);
    logDiagnostic("API", `Location update sent via HTTP POST`, payload);
    return record;
  } catch (error) {
    logDiagnostic("ERROR", `Location update failed entirely: ${(error as any).message}`, error);
    throw error;
  }
}
