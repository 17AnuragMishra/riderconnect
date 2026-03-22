import { parseCoordinatesFromLocationInput } from "@/lib/locationParsing";
import { calculateDistance } from "@/lib/utils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const metricsCache = new Map<
  string,
  { distance: number; duration: { hours: number; minutes: number } }
>();

/** Resolve a place string to coordinates (inline coords, backend geocode, or Nominatim). */
export async function geocode(place: string): Promise<{ lat: number; lng: number } | null> {
  const parsed = parseCoordinatesFromLocationInput(place);
  if (parsed) {
    return parsed;
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/map/geocode?q=${encodeURIComponent(place)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.lat === "number" && typeof data.lng === "number") {
        return { lat: data.lat, lng: data.lng };
      }
    }
  } catch {
    // Fall through to Nominatim
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  } catch {
    // ignore
  }
  return null;
}

async function fetchRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<{ distance: number; duration: number } | null> {
  const params = new URLSearchParams({
    fromLat: String(from.lat),
    fromLng: String(from.lng),
    toLat: String(to.lat),
    toLng: String(to.lng),
  });

  try {
    const res = await fetch(`${API_BASE_URL}/map/route?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (
        typeof data.distance === "number" &&
        typeof data.duration === "number"
      ) {
        return { distance: data.distance, duration: data.duration };
      }
    }
  } catch {
    // Fall through to OSRM
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.routes?.[0]) {
      const distance = data.routes[0].distance ?? 0;
      const duration = data.routes[0].duration ?? 0;
      return { distance, duration };
    }
  } catch {
    // ignore
  }
  return null;
}

export interface RouteMetrics {
  distance: number;
  duration: { hours: number; minutes: number };
}

export async function fetchRouteMetrics(
  source: string,
  destination: string,
  sourceCoords?: { lat: number; lng: number } | null,
  destinationCoords?: { lat: number; lng: number } | null
): Promise<RouteMetrics> {
  const cacheKey = `${source.trim().toLowerCase()}::${destination
    .trim()
    .toLowerCase()}::${sourceCoords?.lat ?? ""},${sourceCoords?.lng ?? ""}::${
    destinationCoords?.lat ?? ""
  },${destinationCoords?.lng ?? ""}`;

  const cached = metricsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const from =
    sourceCoords && Number.isFinite(sourceCoords.lat) && Number.isFinite(sourceCoords.lng)
      ? sourceCoords
      : await geocode(source);
  const to =
    destinationCoords &&
    Number.isFinite(destinationCoords.lat) &&
    Number.isFinite(destinationCoords.lng)
      ? destinationCoords
      : await geocode(destination);

  if (!from || !to) {
    const fallback = { distance: 0, duration: { hours: 0, minutes: 0 } };
    metricsCache.set(cacheKey, fallback);
    return fallback;
  }

  const route = await fetchRoute(from, to);
  let distanceKm: number;
  let totalMinutes: number;

  if (route && route.distance > 0 && route.duration > 0) {
    distanceKm = route.distance / 1000;
    totalMinutes = route.duration / 60;
  } else {
    const meters = calculateDistance(from.lat, from.lng, to.lat, to.lng);
    distanceKm = meters / 1000;
    const estimatedDriveMinutes = (distanceKm / 50) * 60;
    totalMinutes = Math.max(1, Math.round(estimatedDriveMinutes));
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  const result = {
    distance: distanceKm,
    duration: { hours, minutes },
  };

  metricsCache.set(cacheKey, result);
  return result;
}

export function formatDistanceKm(distanceKm: number): string {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return "0m";
  if (distanceKm < 0.001) return `${Math.round(distanceKm * 1000)}m`;
  if (distanceKm < 1) return `${(distanceKm * 1000).toFixed(0)}m`;
  return `${distanceKm.toFixed(1)}km`;
}

export function formatDurationFromMinutes(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
