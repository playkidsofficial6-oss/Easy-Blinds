"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import {
  getAllLiveLocations,
  normalizeLiveLocationRecord,
} from "@/services/api";
import {
  connectSocket,
  disconnectSocket,
  listenToLocationUpdates,
  sendLiveLocationUpdate,
  logDiagnostic,
} from "@/services/socket";
import type {
  LiveLocationPresenceEvent,
  LiveLocationRecord,
  UpdateLiveLocationPayload,
} from "@/types/live-location";

function upsertLocation(
  locations: LiveLocationRecord[],
  nextLocation: LiveLocationRecord,
): LiveLocationRecord[] {
  const existingIndex = locations.findIndex(
    (location) => location.userId === nextLocation.userId,
  );

  if (existingIndex === -1) {
    return [nextLocation, ...locations];
  }

  return locations.map((location, index) =>
    index === existingIndex ? { ...location, ...nextLocation } : location,
  );
}

function applyPresenceEvent(
  locations: LiveLocationRecord[],
  event: LiveLocationPresenceEvent,
  isOnline: boolean,
): LiveLocationRecord[] {
  if (event.location) {
    const normalizedLocation = normalizeLiveLocationRecord(event.location);
    if (normalizedLocation) {
      return upsertLocation(locations, { ...normalizedLocation, isOnline });
    }
  }

  return locations.map((location) =>
    location.userId === event.userId ? { ...location, isOnline } : location,
  );
}

export interface UseLiveLocationOptions {
  onJobUpdated?: (job: any) => void;
  onJobDeleted?: (payload: { id: string; jobId?: string }) => void;
}

export function useLiveLocation(options?: UseLiveLocationOptions) {
  const { token } = useAuth();
  const [locations, setLocations] = useState<LiveLocationRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Count reconnects so we can reload state after each recovery
  const reconnectCountRef = useRef(0);

  const reload = useCallback(async () => {
    setIsLoaded(false);
    setError(null);

    try {
      const nextLocations = await getAllLiveLocations();
      setLocations(nextLocations);
      return nextLocations;
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load live locations.";
      setError(message);
      throw loadError;
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

  // Keep options in a ref so we don't restart socket listeners when callbacks change
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Socket connection and event listeners
  useEffect(() => {
    if (!token) {
      setIsConnected(false);
      return undefined;
    }

    // Connect (or reuse the singleton with this token)
    connectSocket(token);

    const cleanupListeners = listenToLocationUpdates({
      onLocationUpdated: (location) => {
        logDiagnostic(
          "SOCKET",
          `📍 location:updated ${location.userId} → [${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}]`,
          { lat: location.lat, lng: location.lng, accuracy: location.accuracy, speed: location.speed },
        );
        console.log(
          `📍 Map location update:`,
          location.userId,
          location.lat,
          location.lng,
          `liveStatus: ${location.liveStatus}`,
        );
        setLocations((prev) => upsertLocation(prev, location));
      },
      onSalesmanStatusChanged: (payload) => {
        console.log(
          `🚗 Map status change:`,
          payload.userId,
          payload.status,
        );
        setLocations((prev) => {
          const exists = prev.some((l) => l.userId === payload.userId);
          if (!exists) return prev;

          return prev.map((l) =>
            l.userId === payload.userId
              ? {
                  ...l,
                  liveStatus: payload.status,
                  status: payload.status,
                }
              : l
          );
        });
      },
      onUserOnline: (event) => {
        logDiagnostic("SOCKET", `🟢 user:online ${event.userId}`, event);
        setLocations((prev) => applyPresenceEvent(prev, event, true));
      },
      onUserOffline: (event) => {
        logDiagnostic("SOCKET", `🔴 user:offline ${event.userId}`, event);
        setLocations((prev) => applyPresenceEvent(prev, event, false));
      },
      onJobUpdated: (job) => {
        optionsRef.current?.onJobUpdated?.(job);
      },
      onJobDeleted: (payload) => {
        optionsRef.current?.onJobDeleted?.(payload);
      },
      onConnect: () => {
        logDiagnostic("SOCKET", "✅ Manager socket CONNECTED");
        setIsConnected(true);
        reconnectCountRef.current += 1;
        // After any reconnect (not the initial connect) sync state from DB
        // to recover any missed broadcasts during the outage window.
        if (reconnectCountRef.current > 1) {
          logDiagnostic("SOCKET", "🔄 Reloading locations after reconnect...");
          void reload().catch(() => undefined);
        }
      },
      onDisconnect: (reason) => {
        logDiagnostic("SOCKET", `⚠️ Manager socket DISCONNECTED: ${reason}`);
        setIsConnected(false);
      },
      onError: (socketError) => {
        logDiagnostic("ERROR", `❌ Manager socket error: ${socketError.message}`, socketError);
        setError(socketError.message);
      },
    });

    return () => {
      // Only remove event listeners — keep the socket alive so it auto-reconnects.
      // Destroying the socket here causes a new handshake on every re-render.
      cleanupListeners();
    };
  }, [token, reload]);

  // Disconnect only when the user logs out (token becomes null)
  useEffect(() => {
    if (!token) {
      disconnectSocket();
    }
  }, [token]);

  const updateCurrentUserLocation = useCallback(
    async (payload: UpdateLiveLocationPayload) => {
      const nextLocation = await sendLiveLocationUpdate(payload);
      setLocations((prev) => upsertLocation(prev, nextLocation));
      return nextLocation;
    },
    [],
  );

  const locationsByUserId = useMemo(() => {
    return locations.reduce<Record<string, LiveLocationRecord>>(
      (acc, location) => {
        acc[location.userId] = location;
        return acc;
      },
      {},
    );
  }, [locations]);

  return {
    locations,
    locationsByUserId,
    isLoaded,
    isConnected,
    error,
    reload,
    updateLiveLocation: updateCurrentUserLocation,
  };
}
