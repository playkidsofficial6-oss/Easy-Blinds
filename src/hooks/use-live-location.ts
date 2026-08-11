"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import {
  getAllLiveLocations,
  getStoredAuthToken,
  normalizeLiveLocationRecord,
} from "@/services/api";
import {
  connectSocket,
  disconnectSocket,
  listenToLocationUpdates,
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

  // Initial load via REST API
  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

  // Connect socket to receive real-time updates from Flutter app
  useEffect(() => {
    const activeToken = token || getStoredAuthToken();
    if (!activeToken) {
      setIsConnected(false);
      return undefined;
    }

    connectSocket(activeToken);

    const cleanupListeners = listenToLocationUpdates(
      {
        onLocationUpdated: (location) => {
          setLocations((prev) => upsertLocation(prev, location));
        },
        onConnect: () => {
          setIsConnected(true);
        },
        onDisconnect: () => {
          setIsConnected(false);
        },
        onError: (socketError) => {
          setError(socketError.message);
        },
      },
      activeToken,
    );

    return () => {
      cleanupListeners();
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
    }
  }, [token]);

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
  };
}
