"use client";

import { useEffect, useMemo, useState } from "react";
import { Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { GoogleMapsProvider } from "../map/GoogleMapsProvider";
import { GoogleMapController, GoogleMapDirectionsRoute, LatLng } from "../map/GoogleMapHelpers";
import { MapPin, Navigation } from "lucide-react";

interface JobDetailMapProps {
  coordinates: [number, number];
  currentPosition?: [number, number] | null;
  routeEnabled?: boolean;
  interactive?: boolean;
  scrollWheelZoom?: boolean;
  onMapClick?: () => void;
}

function JobDetailMapInner({
  coordinates,
  currentPosition,
  routeEnabled = true,
  interactive = true,
  scrollWheelZoom = false,
  onMapClick,
}: JobDetailMapProps) {
  const [detectedSalesmanCoords, setDetectedSalesmanCoords] = useState<[number, number] | null>(null);
  const [selectedPopup, setSelectedPopup] = useState<"customer" | "user" | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDetectedSalesmanCoords([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Unable to fetch salesman location:", error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const salesmanCoords = useMemo(
    () => currentPosition ?? detectedSalesmanCoords,
    [currentPosition, detectedSalesmanCoords]
  );

  const customerLatLng: LatLng = useMemo(
    () => ({ lat: coordinates[0], lng: coordinates[1] }),
    [coordinates]
  );

  const salesmanLatLng: LatLng | null = useMemo(
    () => (salesmanCoords ? { lat: salesmanCoords[0], lng: salesmanCoords[1] } : null),
    [salesmanCoords]
  );

  const boundsPoints: LatLng[] = useMemo(() => {
    const pts = [customerLatLng];
    if (routeEnabled && salesmanLatLng) {
      pts.push(salesmanLatLng);
    }
    return pts;
  }, [customerLatLng, routeEnabled, salesmanLatLng]);

  return (
    <div className="h-full w-full relative z-0">
      <Map
        defaultCenter={customerLatLng}
        defaultZoom={14}
        mapId="job_detail_map_v1"
        disableDefaultUI={!interactive}
        gestureHandling={interactive ? "greedy" : "none"}
        onClick={() => onMapClick?.()}
        className="h-full w-full"
      >
        <GoogleMapController bounds={boundsPoints} center={customerLatLng} />

        {/* Customer Location Pin */}
        <AdvancedMarker
          position={customerLatLng}
          onClick={() => setSelectedPopup("customer")}
          title="Customer Location"
        >
          <div className="relative flex items-center justify-center">
            <div className="h-9 w-9 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-white">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
        </AdvancedMarker>

        {/* Salesman / Fitter Current Location Pin */}
        {salesmanLatLng && (
          <AdvancedMarker
            position={salesmanLatLng}
            onClick={() => setSelectedPopup("user")}
            title="Your Location"
          >
            <div className="relative flex h-6 w-6 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-md" />
            </div>
          </AdvancedMarker>
        )}

        {/* Road Navigation Line */}
        {routeEnabled && salesmanLatLng && (
          <GoogleMapDirectionsRoute
            start={salesmanLatLng}
            end={customerLatLng}
            strokeColor="#f59e0b"
            strokeWeight={5}
          />
        )}

        {/* InfoWindow */}
        {selectedPopup === "customer" && (
          <InfoWindow
            position={customerLatLng}
            onCloseClick={() => setSelectedPopup(null)}
          >
            <div className="p-1.5 text-xs font-bold text-slate-800">
              Customer Destination
            </div>
          </InfoWindow>
        )}

        {selectedPopup === "user" && salesmanLatLng && (
          <InfoWindow
            position={salesmanLatLng}
            onCloseClick={() => setSelectedPopup(null)}
          >
            <div className="p-1.5 text-xs font-bold text-slate-800">
              Your Current Location
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}

export default function JobDetailMap(props: JobDetailMapProps) {
  return (
    <GoogleMapsProvider fallbackHeight="100%">
      <JobDetailMapInner {...props} />
    </GoogleMapsProvider>
  );
}
