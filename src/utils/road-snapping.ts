/**
 * Client-side road snapping utility using the public OSRM Nearest API.
 * Snaps raw GPS coordinates to the nearest drivable road.
 * Includes a fast timeout and automatic fallback to raw coordinates.
 */

interface OsrmNearestResponse {
  code: string;
  waypoints?: Array<{
    distance: number;
    name: string;
    location: [number, number]; // [lng, lat]
  }>;
}

const OSRM_TIMEOUT_MS = 1500;

export async function snapToRoad(lat: number, lng: number): Promise<[number, number]> {
  // Validate coordinates
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
    return [lat, lng];
  }

  const url = `https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}`;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`OSRM responded with status ${response.status}`);
    }

    const data = (await response.json()) as OsrmNearestResponse;

    if (data.code === "Ok" && data.waypoints && data.waypoints.length > 0) {
      const snappedCoordinates = data.waypoints[0].location; // [lng, lat]
      const distance = data.waypoints[0].distance;

      // Only snap if the nearest road is within a reasonable distance (e.g. 50 meters)
      // to avoid jumping to nearby highways if the user is in a building/driveway.
      if (distance <= 50) {
        return [snappedCoordinates[1], snappedCoordinates[0]];
      }
    }
  } catch (error) {
    // Silent fail, return original raw coordinates so tracking is never blocked
    console.debug("[Road Snapping] Falling back to raw coordinates:", error);
  }

  return [lat, lng];
}
