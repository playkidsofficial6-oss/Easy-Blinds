import { io, type Socket } from "socket.io-client";

import { getStoredAuthToken } from "@/services/api";
import { normalizeLiveLocationRecord } from "@/services/api/live-location";
import type {
  BackendLiveLocationRecord,
  LiveLocationPresenceEvent,
  LiveLocationRecord,
  LiveLocationSocketListeners,
  LiveLocationUpdatedEvent,
} from "@/types/live-location";
import {
  LIVE_LOCATION_SOCKET_URL,
  SOCKET_RECONNECTION_CONFIG,
} from "./config";

let liveLocationSocket: Socket | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function resolveLocationPayload(
  payload: BackendLiveLocationRecord | LiveLocationUpdatedEvent,
): LiveLocationRecord | null {
  if (isRecord(payload) && "location" in payload) {
    const nestedLocation = payload.location;

    if (isRecord(nestedLocation) && "userId" in nestedLocation) {
      return normalizeLiveLocationRecord(
        nestedLocation as unknown as BackendLiveLocationRecord,
      );
    }
  }

  if (isRecord(payload) && "data" in payload) {
    return normalizeLiveLocationRecord(payload.data as BackendLiveLocationRecord);
  }

  return normalizeLiveLocationRecord(payload as BackendLiveLocationRecord);
}

function normalizePresencePayload(
  payload: LiveLocationPresenceEvent,
): LiveLocationPresenceEvent {
  return {
    ...payload,
    timestamp: payload.timestamp ?? payload.lastUpdatedAt,
  };
}

export function getLiveLocationSocket(): Socket | null {
  return liveLocationSocket;
}

export function connectSocket(token = getStoredAuthToken()): Socket | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!token) {
    disconnectSocket();
    return null;
  }

  if (liveLocationSocket?.connected) {
    return liveLocationSocket;
  }

  if (liveLocationSocket) {
    liveLocationSocket.auth = { token };
    liveLocationSocket.connect();
    return liveLocationSocket;
  }

  liveLocationSocket = io(LIVE_LOCATION_SOCKET_URL, {
    ...SOCKET_RECONNECTION_CONFIG,
    auth: { token },
    autoConnect: true,
    transports: ["websocket", "polling"],
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
): () => void {
  const socket = connectSocket();

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
  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  socket.on("connect_error", handleError);
  socket.on("exception", handleError);

  return () => {
    socket.off("location:updated", handleLocationUpdated);
    socket.off("user:online", handleUserOnline);
    socket.off("user:offline", handleUserOffline);
    socket.off("connect", handleConnect);
    socket.off("disconnect", handleDisconnect);
    socket.off("connect_error", handleError);
    socket.off("exception", handleError);
  };
}
