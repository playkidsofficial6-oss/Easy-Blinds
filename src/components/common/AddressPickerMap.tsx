"use client";

import { useEffect, useState, useCallback } from "react";
import { Map, AdvancedMarker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { toast } from "sonner";
import { GoogleMapsProvider } from "../map/GoogleMapsProvider";
import { GoogleMapController, LatLng } from "../map/GoogleMapHelpers";

interface AddressPickerMapProps {
  onAddressSelect: (address: string, coords?: [number, number]) => void;
  externalCoords?: [number, number] | null;
}

function AddressPickerMapInner({ onAddressSelect, externalCoords }: AddressPickerMapProps) {
  const [position, setPosition] = useState<LatLng | null>(
    externalCoords ? { lat: externalCoords[0], lng: externalCoords[1] } : null
  );
  const geocodingLib = useMapsLibrary("geocoding");
  const defaultCenter: LatLng = { lat: 10.8505, lng: 76.2711 };

  useEffect(() => {
    if (externalCoords && externalCoords[0] && externalCoords[1]) {
      setPosition({ lat: externalCoords[0], lng: externalCoords[1] });
    }
  }, [externalCoords]);

  const handleMapClick = useCallback(
    async (e: any) => {
      const lat = e.detail?.latLng?.lat || e.latLng?.lat?.();
      const lng = e.detail?.latLng?.lng || e.latLng?.lng?.();

      if (!lat || !lng) return;

      const newPos: LatLng = { lat, lng };
      setPosition(newPos);

      // Try Google Maps Geocoder first if available
      if (geocodingLib) {
        try {
          const geocoder = new geocodingLib.Geocoder();
          const response = await geocoder.geocode({ location: newPos });
          if (response.results && response.results[0]) {
            const formatted = response.results[0].formatted_address;
            onAddressSelect(formatted, [lat, lng]);
            return;
          }
        } catch (err) {
          console.warn("Google Maps Geocoder error, trying OSM fallback:", err);
        }
      }

      // Fallback reverse geocoding
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        if (data && data.display_name) {
          onAddressSelect(data.display_name, [lat, lng]);
        } else {
          toast.error("Could not determine address for this location.");
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        toast.error("Failed to fetch address details.");
      }
    },
    [geocodingLib, onAddressSelect]
  );

  return (
    <div className="h-64 w-full rounded-xl border-2 border-slate-200 overflow-hidden relative z-0 mt-2 shadow-sm">
      <div className="absolute top-2 right-2 z-10 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm border border-slate-200 pointer-events-none">
        Click Map to Pick Address
      </div>

      <Map
        defaultCenter={position || defaultCenter}
        defaultZoom={12}
        mapId="address_picker_map_v1"
        onClick={handleMapClick}
        disableDefaultUI={false}
        gestureHandling="greedy"
        className="h-full w-full"
      >
        <GoogleMapController center={position} zoom={14} />

        {position && (
          <AdvancedMarker position={position}>
            <div className="relative flex h-7 w-7 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-6 w-6 bg-amber-500 border-2 border-white shadow-md" />
            </div>
          </AdvancedMarker>
        )}
      </Map>
    </div>
  );
}

export default function AddressPickerMap(props: AddressPickerMapProps) {
  return (
    <GoogleMapsProvider fallbackHeight="256px">
      <AddressPickerMapInner {...props} />
    </GoogleMapsProvider>
  );
}
