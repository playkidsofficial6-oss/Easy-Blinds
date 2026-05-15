import { io, type Socket } from "socket.io-client";

import { getStoredAuthToken } from "@/services/api";
import type {
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

function resolveLocationPayload(
  payload: LiveLocationRecord | LiveLocationUpdatedEvent,
): LiveLocationRecord {
  if (payload && typeof payload === "object" && "location" in payload) {
    return payload.location;
  }

  return payload as LiveLocationRecord;
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
    payload: LiveLocationRecord | LiveLocationUpdatedEvent,
  ) => {
    listeners.onLocationUpdated?.(resolveLocationPayload(payload));
  };

  const handleUserOnline = (payload: LiveLocationPresenceEvent) => {
    listeners.onUserOnline?.(payload);
  };

  const handleUserOffline = (payload: LiveLocationPresenceEvent) => {
    listeners.onUserOffline?.(payload);
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
