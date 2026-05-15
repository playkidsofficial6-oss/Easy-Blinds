import type { Coordinates } from "./types";

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const radiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return radiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function estimateEtaMinutes(distance: number): number {
  const averageUrbanSpeedKmh = 32;
  const minutes = (distance / averageUrbanSpeedKmh) * 60;
  return Math.max(5, Math.round(minutes));
}

export function routeSummary(from: Coordinates, to: Coordinates) {
  const distance = Number(distanceKm(from, to).toFixed(1));
  return {
    distanceKm: distance,
    etaMinutes: estimateEtaMinutes(distance),
  };
}

export function nudgeTowards(current: Coordinates, target: Coordinates, ratio = 0.08): Coordinates {
  return {
    lat: Number((current.lat + (target.lat - current.lat) * ratio).toFixed(6)),
    lng: Number((current.lng + (target.lng - current.lng) * ratio).toFixed(6)),
  };
}

export function fallbackDubaiCoordinates(area: string): Coordinates {
  const normalized = area.toLowerCase();
  if (normalized.includes("marina")) return { lat: 25.0868, lng: 55.145 };
  if (normalized.includes("downtown")) return { lat: 25.1972, lng: 55.2744 };
  if (normalized.includes("palm")) return { lat: 25.1124, lng: 55.139 };
  if (normalized.includes("springs")) return { lat: 25.0487, lng: 55.1765 };
  if (normalized.includes("jumeirah")) return { lat: 25.0441, lng: 55.1522 };
  if (normalized.includes("ranches")) return { lat: 25.0298, lng: 55.2917 };
  return { lat: 25.2048, lng: 55.2708 };
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}
