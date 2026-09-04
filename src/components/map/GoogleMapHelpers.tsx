"use client";

import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";

export interface LatLng {
  lat: number;
  lng: number;
}

export function GoogleMapController({
  center,
  zoom,
  bounds,
}: {
  center?: LatLng | null;
  zoom?: number;
  bounds?: LatLng[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (center && (!bounds || bounds.length <= 1)) {
      map.panTo(center);
      if (typeof zoom === "number") {
        map.setZoom(zoom);
      }
    }
  }, [map, center, zoom, bounds]);

  useEffect(() => {
    if (!map || !bounds || bounds.length < 2) return;
    const latLngBounds = new google.maps.LatLngBounds();
    let validCount = 0;
    bounds.forEach((pt) => {
      if (Number.isFinite(pt.lat) && Number.isFinite(pt.lng)) {
        latLngBounds.extend(pt);
        validCount++;
      }
    });

    if (validCount >= 2) {
      map.fitBounds(latLngBounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }
  }, [map, bounds]);

  return null;
}

export function GoogleMapPolyline({
  path,
  strokeColor = "#10b981",
  strokeOpacity = 0.9,
  strokeWeight = 4,
  geodesic = true,
  dashed = false,
}: {
  path: LatLng[];
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  geodesic?: boolean;
  dashed?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.google || !path || path.length < 2) return;

    const lineSymbol = dashed
      ? {
          path: "M 0,-1 0,1",
          strokeOpacity: 1,
          scale: 3,
        }
      : undefined;

    const polyline = new google.maps.Polyline({
      path,
      strokeColor,
      strokeOpacity: dashed ? 0 : strokeOpacity,
      strokeWeight,
      geodesic,
      icons: dashed
        ? [
            {
              icon: lineSymbol,
              offset: "0",
              repeat: "16px",
            },
          ]
        : undefined,
      map,
    });

    return () => {
      polyline.setMap(null);
    };
  }, [map, path, strokeColor, strokeOpacity, strokeWeight, geodesic, dashed]);

  return null;
}

export function GoogleMapDirectionsRoute({
  start,
  end,
  strokeColor = "#10b981",
  strokeWeight = 5,
}: {
  start: LatLng;
  end: LatLng;
  strokeColor?: string;
  strokeWeight?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.google || !start || !end) return;

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: {
        strokeColor,
        strokeOpacity: 0.9,
        strokeWeight,
      },
    });

    directionsService.route(
      {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        }
      }
    );

    return () => {
      directionsRenderer.setMap(null);
    };
  }, [map, start, end, strokeColor, strokeWeight]);

  return null;
}
