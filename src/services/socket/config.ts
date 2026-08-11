import { API_BASE_URL } from "@/services/api";

export const LIVE_LOCATION_NAMESPACE = "/flutter/live-location";

function normalizeSocketBaseUrl(url: string): string {
  return url
    .replace(/\/+$/, "")              // remove trailing slashes
    .replace(/\/api\/v\d+\/?$/, "")   // strip /api/v1, /api/v10 etc.
    .replace(/\/api\/?$/, "");         // strip trailing /api if no version
}

export const SOCKET_BASE_URL = normalizeSocketBaseUrl(
  process.env.NEXT_PUBLIC_SOCKET_URL ?? API_BASE_URL,
);

export const LIVE_LOCATION_SOCKET_URL = `${SOCKET_BASE_URL}${LIVE_LOCATION_NAMESPACE}`;

export const SOCKET_RECONNECTION_CONFIG = {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
} as const;
