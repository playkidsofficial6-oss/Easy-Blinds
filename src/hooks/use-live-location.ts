"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getAllLiveLocations,
  updateLiveLocation,
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

function applyPresenceEvent(
  locations: LiveLocationRecord[],
  event: LiveLocationPresenceEvent,
  isOnline: boolean,
): LiveLocationRecord[] {
  if (event.location) {
    return upsertLocation(locations, { ...event.location, isOnline });
  }

  return locations.map((location) =>
    location.userId === event.userId ? { ...location, isOnline } : location,
  );
}

export function useLiveLocation() {
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

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

  useEffect(() => {
    connectSocket();

    const cleanupListeners = listenToLocationUpdates({
      onLocationUpdated: (location) => {
        setLocations((currentLocations) =>
          upsertLocation(currentLocations, location),
        );
      },
      onUserOnline: (event) => {
        setLocations((currentLocations) =>
          applyPresenceEvent(currentLocations, event, true),
        );
      },
      onUserOffline: (event) => {
        setLocations((currentLocations) =>
          applyPresenceEvent(currentLocations, event, false),
        );
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
    });

    return () => {
      cleanupListeners();
      disconnectSocket();
    };
  }, []);

  const updateCurrentUserLocation = useCallback(
    async (payload: UpdateLiveLocationPayload) => {
      const nextLocation = await updateLiveLocation(payload);
      setLocations((currentLocations) =>
        upsertLocation(currentLocations, nextLocation),
      );
      return nextLocation;
    },
    [],
  );

  const locationsByUserId = useMemo(() => {
    return locations.reduce<Record<string, LiveLocationRecord>>(
      (accumulator, location) => {
        accumulator[location.userId] = location;
        return accumulator;
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
