"use client";

import { useEffect, useState, useRef } from "react";
import type { MutableRefObject } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  ZoomControl,
  ScaleControl,
  LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useUser } from "@clerk/nextjs";
import L from "leaflet";
import { Info, LocateFixed } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn, calculateDistance } from "@/lib/utils";
import { parseCoordinatesFromLocationInput } from "@/lib/locationParsing";
import { geocode } from "@/lib/mapUtils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface MapComponentProps {
  location: { latitude: number; longitude: number };
  groupLocations: [string, { lat: number; lng: number }][];
  members?: { clerkId: string; name: string; avatar?: string; isOnline?: boolean }[];
  source: string;
  destination: string;
  sourceCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  focusedLocation?: { lat: number; lng: number } | null;
}

type LatLng = [number, number];

const coordinateCache = new Map<string, LatLng>();
type RoutePath = {
  coords: LatLng[];
  distance: number;
  duration: number;
};

type CachedRoute = {
  primary: RoutePath;
  alternatives?: RoutePath[];
};

const routeCache = new Map<string, CachedRoute>();
const profileMetricsCache = new Map<string, { duration: number; distance: number }>();

function createAvatarIcon(
  _avatarUrl?: string,
  isOnline: boolean = false,
  isSelf: boolean = false
) {
  const emoji = "😐";
  const borderColor = isSelf
    ? "#ff00ff"
    : isOnline
      ? "#00f2ff"
      : "#9ca3af";
  const boxShadow = isSelf
    ? "0 0 16px rgba(255,0,255,0.9), 0 0 6px rgba(255,0,255,0.6)"
    : isOnline
      ? "0 0 12px rgba(0,242,255,0.65)"
      : "none";

  return L.divIcon({
    html: `
      <div
        style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid ${borderColor};
          background: #ffffff;
          box-shadow: ${boxShadow};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        "
      >
        <span>${emoji}</span>
      </div>
    `,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const sourceIcon = L.divIcon({
  html: `
    <div
      style="
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #00f2ff;
        border: 2px solid rgba(0,242,255,0.85);
        box-shadow: 0 0 14px rgba(0,242,255,0.75);
      "
    ></div>
  `,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapUpdater({
  center,
  locations,
  isInitialLoad,
}: {
  center: L.LatLngTuple;
  locations: [string, { lat: number; lng: number }][];
  isInitialLoad: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (isInitialLoad && map) {
      const bounds = L.latLngBounds([center]);
      locations.forEach(([, { lat, lng }]) => bounds.extend([lat, lng]));
      map.fitBounds(bounds, { padding: [100, 100] });
    }
  }, [map, center, locations, isInitialLoad]);
  return null;
}

/** Keeps a ref to the Leaflet map for controls rendered outside the map pane (above overlays). */
function MapInstanceBridge({ mapRef }: { mapRef: MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);
  return null;
}

function FlyToLocation({ location }: { location: { lat: number; lng: number } | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (location && map) {
      map.flyTo([location.lat, location.lng], 16, { animate: true, duration: 1.2 });
    }
  }, [location, map]);

  if (!location) return null;

  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={redIcon}
    >
      <Popup>
        <div className="text-sm font-semibold">Last Known Location</div>
      </Popup>
    </Marker>
  );
}

function UserMarker({
  position,
  avatar,
  isOnline,
  progressLabel,
  destinationEtas,
}: {
  position: LatLng;
  avatar?: string;
  isOnline?: boolean;
  progressLabel?: string | null;
  destinationEtas?: { car: string; bike: string; foot: string } | null;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (markerRef.current && map) {
      markerRef.current.setLatLng(position);
    }
  }, [position, map]);

  return (
    <Marker
      position={position}
      icon={createAvatarIcon(avatar, isOnline || false, true)}
      ref={markerRef}
    >
      <Popup>
        <div className="space-y-1">
          <div>Your Location</div>
          {progressLabel && (
            <div className="text-xs text-muted-foreground">
              {progressLabel}
            </div>
          )}
          {destinationEtas && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>To destination:</div>
              <div>Car: {destinationEtas.car}</div>
              <div>Bike: {destinationEtas.bike}</div>
              <div>Foot: {destinationEtas.foot}</div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapComponent({
  location,
  groupLocations,
  members,
  source,
  destination,
  sourceCoords,
  destinationCoords,
  focusedLocation,
}: MapComponentProps) {
  const { user } = useUser();
  const userPos: LatLng = [location.latitude, location.longitude];
  const sourceFromText = parseCoordinatesFromLocationInput(source);
  const destinationFromText = parseCoordinatesFromLocationInput(destination);
  const hasExactSource =
    (sourceCoords &&
      Number.isFinite(sourceCoords.lat) &&
      Number.isFinite(sourceCoords.lng)) ||
    !!sourceFromText;
  const hasExactDestination =
    (destinationCoords &&
      Number.isFinite(destinationCoords.lat) &&
      Number.isFinite(destinationCoords.lng)) ||
    !!destinationFromText;
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [srcCoords, setSrcCoords] = useState<LatLng | null>(null);
  const [dstCoords, setDstCoords] = useState<LatLng | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [availableRoutes, setAvailableRoutes] = useState<RoutePath[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [destinationTravelTimes, setDestinationTravelTimes] = useState<{
    car: number | null;
    bike: number | null;
    foot: number | null;
  }>({ car: null, bike: null, foot: null });
  const [showEtaInfo, setShowEtaInfo] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const canLocateUser =
    Number.isFinite(userPos[0]) &&
    Number.isFinite(userPos[1]) &&
    Math.abs(userPos[0]) <= 90 &&
    Math.abs(userPos[1]) <= 180;

  async function fetchCoordinates(place: string): Promise<LatLng | null> {
    const parsedCoords = parseCoordinatesFromLocationInput(place);
    if (parsedCoords) {
      return [parsedCoords.lat, parsedCoords.lng];
    }

    const key = place.trim().toLowerCase();
    if (coordinateCache.has(key)) {
      return coordinateCache.get(key)!;
    }

    const resolved = await geocode(place);
    if (resolved && Number.isFinite(resolved.lat) && Number.isFinite(resolved.lng)) {
      const coords: LatLng = [resolved.lat, resolved.lng];
      coordinateCache.set(key, coords);
      return coords;
    }
    return null;
  }

  const LoadingOverlay = () => (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm dark:bg-background/90 bg-grid-pattern"
      style={{ height: "100%", width: "100%" }}
    >
      <div className="animate-pulse-gentle flex flex-col items-center space-y-4 p-6 max-w-xs w-full">
        <div className="shadow-glow rounded-lg bg-card p-4 w-full">
          <div className="text-center mb-3 text-sm font-medium text-primary">
            Loading Map Data
          </div>
          <Progress value={loadingProgress} className="h-2 w-full" />
          <div className="mt-2 text-xs text-muted-foreground text-center">
            {loadingProgress < 100
              ? "Fetching route information..."
              : "Rendering map..."}
          </div>
        </div>
      </div>
    </div>
  );

  function formatDistanceFromMeters(meters: number): string {
    if (!Number.isFinite(meters) || meters < 0) return "";
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  }

  function formatDurationFromSeconds(seconds: number | null): string {
    if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
      return "—";
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 1) return "<1 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? `${hours} h` : `${hours} h ${mins} min`;
  }

  function estimateDurationFromSpeed(
    distanceMeters: number,
    speedKmPerHour: number
  ): number | null {
    if (
      !Number.isFinite(distanceMeters) ||
      distanceMeters <= 0 ||
      !Number.isFinite(speedKmPerHour) ||
      speedKmPerHour <= 0
    ) {
      return null;
    }
    const speedMetersPerSecond = (speedKmPerHour * 1000) / 3600;
    return distanceMeters / speedMetersPerSecond;
  }

  function formatEtaFromDistance(metersFromStart: number): string | null {
    if (!routeInfo || !routeInfo.distance || !routeInfo.duration) return null;
    const avgSpeed = routeInfo.distance / routeInfo.duration; // meters per second
    if (!Number.isFinite(avgSpeed) || avgSpeed <= 0) return null;
    const seconds = metersFromStart / avgSpeed;
    const minutes = Math.round(seconds / 60);
    if (minutes < 1) return "<1 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? `${hours} h` : `${hours} h ${mins} min`;
  }

  function getProgressLabel(lat: number, lng: number): string | null {
    if (!srcCoords) return null;
    const distanceFromStart = calculateDistance(lat, lng, srcCoords[0], srcCoords[1]);
    const distanceText = formatDistanceFromMeters(distanceFromStart);
    if (!distanceText) return null;
    return `${distanceText} from start`;
  }

  async function fetchRouteMetricsByProfile(
    from: LatLng,
    to: LatLng,
    profile: "driving" | "cycling" | "walking"
  ): Promise<{ duration: number; distance: number } | null> {
    const key = `${profile}:${from[0]},${from[1]}-${to[0]},${to[1]}`;
    const cachedMetrics = profileMetricsCache.get(key);
    if (cachedMetrics) {
      return cachedMetrics;
    }

    try {
      const params = new URLSearchParams({
        fromLat: String(from[0]),
        fromLng: String(from[1]),
        toLat: String(to[0]),
        toLng: String(to[1]),
        profile,
      });

      const res = await fetch(`${API_BASE_URL}/map/route?${params.toString()}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (typeof data.duration === "number" && typeof data.distance === "number") {
        const metrics = { duration: data.duration, distance: data.distance };
        profileMetricsCache.set(key, metrics);
        return metrics;
      }
    } catch (error) {
      console.error(`Failed to fetch ${profile} metrics`, error);
    }

    return null;
  }

  async function fetchRoute(from: LatLng, to: LatLng) {
    const key = `${from[0]},${from[1]}-${to[0]},${to[1]}`;

    if (routeCache.has(key)) {
      const cached = routeCache.get(key)!;
      const routes: RoutePath[] = [
        cached.primary,
        ...(cached.alternatives || []),
      ];
      setAvailableRoutes(routes);
      setSelectedRouteIndex(0);
      setRouteCoords(routes[0].coords);
      setRouteInfo({
        distance: routes[0].distance,
        duration: routes[0].duration,
      });
      return;
    }

    // First try backend route with caching
    try {
      const params = new URLSearchParams({
        fromLat: String(from[0]),
        fromLng: String(from[1]),
        toLat: String(to[0]),
        toLng: String(to[1]),
      });

      const res = await fetch(`${API_BASE_URL}/map/route?${params.toString()}`);

      if (res.ok) {
        const data = await res.json();

        const buildRoutePath = (geometry: any, distance: number, duration: number): RoutePath | null => {
          if (
            !geometry ||
            !Array.isArray(geometry.coordinates) ||
            geometry.coordinates.length === 0
          ) {
            return null;
          }

          const coords: LatLng[] = geometry.coordinates.map(
            ([lng, lat]: number[]) => [lat, lng]
          );

          return {
            coords,
            distance: typeof distance === "number" ? distance : 0,
            duration: typeof duration === "number" ? duration : 0,
          };
        };

        const primary = buildRoutePath(
          data.geometry,
          data.distance,
          data.duration
        );

        const alternatives: RoutePath[] =
          Array.isArray(data.alternatives) && data.alternatives.length > 0
            ? data.alternatives
              .map((alt: any) =>
                buildRoutePath(alt.geometry, alt.distance, alt.duration)
              )
              .filter(Boolean) as RoutePath[]
            : [];

        if (primary) {
          const routes: RoutePath[] = [primary, ...alternatives];

          setAvailableRoutes(routes);
          setSelectedRouteIndex(0);
          setRouteCoords(primary.coords);
          setRouteInfo({
            distance: primary.distance,
            duration: primary.duration,
          });

          routeCache.set(key, {
            primary,
            alternatives: alternatives.length ? alternatives : undefined,
          });
          return;
        }
      } else {
        const text = await res.text().catch(() => "");
        console.error(
          "Backend route failed:",
          res.status,
          text || res.statusText
        );
      }
    } catch (error) {
      console.error("Backend route error:", error);
    }

    // Fallback: call OSRM directly (previous behavior)
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&alternatives=true&steps=false`
      );

      if (!res.ok) {
        console.error(
          "Fallback route failed:",
          res.status,
          res.statusText
        );
        return;
      }

      const data = await res.json();

      if (data.routes && Array.isArray(data.routes) && data.routes.length > 0) {
        const toRoutePath = (route: any): RoutePath | null => {
          if (
            !route.geometry ||
            !Array.isArray(route.geometry.coordinates) ||
            route.geometry.coordinates.length === 0
          ) {
            return null;
          }

          const coords: LatLng[] = route.geometry.coordinates.map(
            ([lng, lat]: number[]) => [lat, lng]
          );

          return {
            coords,
            distance: typeof route.distance === "number" ? route.distance : 0,
            duration: typeof route.duration === "number" ? route.duration : 0,
          };
        };

        const primaryRoute = toRoutePath(data.routes[0]);
        const alternativeRoutes: RoutePath[] =
          data.routes
            .slice(1)
            .map((r: any) => toRoutePath(r))
            .filter(Boolean) as RoutePath[];

        if (primaryRoute) {
          const routes: RoutePath[] = [primaryRoute, ...alternativeRoutes];

          setAvailableRoutes(routes);
          setSelectedRouteIndex(0);
          setRouteCoords(primaryRoute.coords);
          setRouteInfo({
            distance: primaryRoute.distance,
            duration: primaryRoute.duration,
          });

          routeCache.set(key, {
            primary: primaryRoute,
            alternatives: alternativeRoutes.length
              ? alternativeRoutes
              : undefined,
          });
        }
      }
    } catch (error) {
      console.error("Fallback route error:", error);
    }
  }

  useEffect(() => {
    async function getRoute() {
      setIsLoading(true);
      setLoadingProgress(10);

      try {
        const from =
          sourceCoords && Number.isFinite(sourceCoords.lat) && Number.isFinite(sourceCoords.lng)
            ? ([sourceCoords.lat, sourceCoords.lng] as LatLng)
            : await fetchCoordinates(source);
        setLoadingProgress(40);

        const to =
          destinationCoords &&
            Number.isFinite(destinationCoords.lat) &&
            Number.isFinite(destinationCoords.lng)
            ? ([destinationCoords.lat, destinationCoords.lng] as LatLng)
            : await fetchCoordinates(destination);
        setLoadingProgress(70);

        setSrcCoords(from ?? null);
        setDstCoords(to ?? null);
        if (from && to) {
          await fetchRoute(from, to);
        } else {
          setRouteCoords([]);
          setAvailableRoutes([]);
          setRouteInfo(null);
        }
        setLoadingProgress(100);
      } catch (error) {
        console.error("Error loading map data:", error);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    }
    getRoute();
  }, [source, destination, sourceCoords, destinationCoords]);

  useEffect(() => {
    const loadModeDurations = async () => {
      if (!dstCoords) {
        setDestinationTravelTimes({ car: null, bike: null, foot: null });
        return;
      }

      const from: LatLng = [location.latitude, location.longitude];
      const [carMetrics, bikeMetrics, footMetrics] = await Promise.all([
        fetchRouteMetricsByProfile(from, dstCoords, "driving"),
        fetchRouteMetricsByProfile(from, dstCoords, "cycling"),
        fetchRouteMetricsByProfile(from, dstCoords, "walking"),
      ]);

      const directDistance = calculateDistance(
        from[0],
        from[1],
        dstCoords[0],
        dstCoords[1]
      );
      const baseDistanceMeters =
        carMetrics?.distance ||
        bikeMetrics?.distance ||
        footMetrics?.distance ||
        directDistance * 1.35;

      const carFallback = estimateDurationFromSpeed(baseDistanceMeters, 38);
      const bikeFallback = estimateDurationFromSpeed(baseDistanceMeters, 16);
      const footFallback = estimateDurationFromSpeed(baseDistanceMeters, 5);

      let car = carMetrics?.duration ?? carFallback;
      let bike = bikeMetrics?.duration ?? bikeFallback;
      let foot = footMetrics?.duration ?? footFallback;

      if (car != null && bike != null) {
        const ratio = Math.abs(car - bike) / Math.max(car, 1);
        if (ratio < 0.08) {
          bike = bikeFallback ?? Math.max(bike, car * 1.5);
        }
      }

      if (car != null && foot != null) {
        const ratio = Math.abs(car - foot) / Math.max(car, 1);
        if (ratio < 0.2) {
          foot = footFallback ?? Math.max(foot, car * 2.8);
        }
      }

      if (car != null && bike != null && bike <= car) {
        bike = Math.max(bike, car * 1.2);
      }
      if (bike != null && foot != null && foot <= bike) {
        foot = Math.max(foot, bike * 1.5);
      }

      setDestinationTravelTimes({ car, bike, foot });
    };

    loadModeDurations();
  }, [location.latitude, location.longitude, dstCoords]);

  useEffect(() => {
    if (isInitialLoad) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);

  // Define different map tile layers
  const mapLayers = {
    standard: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '© <a href="https://www.esri.com/">Esri</a>'
    },
    terrain: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>'
    }
  };

  return (
    <div className="relative w-full h-full min-h-[350px] xs:min-h-[450px] sm:min-h-[500px] md:min-h-[70vh] lg:min-h-[70vh]">
      <div
        className={cn(
          "map-container h-full w-full transition-all duration-300 ease-in-out relative shadow-md rounded-lg overflow-hidden",
          "bg-muted/30 dark:bg-muted/10",
          "touch-optimized"
        )}
        style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          minHeight: 'inherit'
        }}
      >

        {availableRoutes.length > 1 && (
          <div className="absolute top-5 left-3 z-30 space-y-2">
            <div className="rounded-md bg-background/90 shadow-lg border px-3 py-2 text-xs">
              <div className="font-semibold mb-1">Routes</div>
              <div className="flex gap-2">
                {availableRoutes.map((route, index) => (
                  <button
                    key={index}
                    type="button"
                    className={cn(
                      "px-2 py-1 rounded border text-[11px] leading-tight",
                      index === selectedRouteIndex
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-muted hover:bg-muted/60"
                    )}
                    onClick={() => {
                      setSelectedRouteIndex(index);
                      setRouteCoords(route.coords);
                      setRouteInfo({
                        distance: route.distance,
                        duration: route.duration,
                      });
                    }}
                  >
                    <div>Route {index + 1}</div>
                    <div className="text-[10px] text-muted-foreground">
                      <span className="font-mono text-electric">
                        {formatDistanceFromMeters(route.distance)}
                      </span>
                      {" "}•{" "}
                      <span className="font-mono text-electric">
                        {formatEtaFromDistance(route.distance) ?? "—"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => setShowEtaInfo((prev) => !prev)}
            className="h-9 w-9 rounded-full border bg-background/90 shadow-lg flex items-center justify-center hover:bg-muted/80 transition"
            aria-label="Toggle ETA details"
            title="ETA details"
          >
            <Info className="h-4 w-4" />
          </button>
          {showEtaInfo && (
            <div className="rounded-md bg-background/90 shadow-lg border px-3 py-2 text-xs min-w-[180px]">
              <div className="font-semibold mb-1">ETA to Destination</div>
              <div className="space-y-1 text-muted-foreground">
                <div>Car: {formatDurationFromSeconds(destinationTravelTimes.car)}</div>
                <div>Bike: {formatDurationFromSeconds(destinationTravelTimes.bike)}</div>
                <div>Foot: {formatDurationFromSeconds(destinationTravelTimes.foot)}</div>
              </div>
            </div>
          )}
        </div>
        {!mapReady && <LoadingOverlay />}
        <MapContainer
          center={userPos}
          zoom={13}
          scrollWheelZoom={true}
          className="h-full w-full z-10"
          zoomAnimation={true}
          fadeAnimation={true}
          markerZoomAnimation={true}
          zoomControl={false}
          style={{
            height: '100%',
            width: '100%',
            minHeight: 'inherit',
            position: 'relative',
            zIndex: 1
          }}
          whenReady={() => {
            console.log('Map is ready');
            setMapReady(true);
          }}
        >
          <ZoomControl position="topright" />
          <ScaleControl position="bottomright" metric={true} imperial={false} />
          <MapInstanceBridge mapRef={mapRef} />
          <FlyToLocation location={focusedLocation} />

          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Standard">
              <TileLayer
                attribution={mapLayers.standard.attribution}
                url={mapLayers.standard.url}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution={mapLayers.satellite.attribution}
                url={mapLayers.satellite.url}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Terrain">
              <TileLayer
                attribution={mapLayers.terrain.attribution}
                url={mapLayers.terrain.url}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {mapReady && (
            <>
              <MapUpdater center={userPos} locations={groupLocations} isInitialLoad={isInitialLoad} />

              {srcCoords && (
                <Marker position={srcCoords} icon={sourceIcon}>
                  <Popup>Source</Popup>
                </Marker>
              )}

              {dstCoords && (
                <Marker position={dstCoords} icon={redIcon}>
                  <Popup>Destination</Popup>
                </Marker>
              )}

              {availableRoutes.length > 0
                ? availableRoutes.map((route, index) => (
                  <Polyline
                    key={index}
                    positions={route.coords}
                    pathOptions={{
                      color: index === selectedRouteIndex ? "#ff00ff" : "#64748b",
                      weight: index === selectedRouteIndex ? 5 : 3,
                      opacity: index === selectedRouteIndex ? 0.92 : 0.55,
                    }}
                  />
                ))
                : routeCoords.length > 0 && (
                  <Polyline
                    positions={routeCoords}
                    pathOptions={{ color: "#ff00ff" }}
                  />
                )}

              <UserMarker
                position={userPos}
                avatar={members?.find((m) => m.clerkId === user?.id)?.avatar}
                isOnline={members?.find((m) => m.clerkId === user?.id)?.isOnline}
                progressLabel={getProgressLabel(userPos[0], userPos[1])}
                destinationEtas={{
                  car: formatDurationFromSeconds(destinationTravelTimes.car),
                  bike: formatDurationFromSeconds(destinationTravelTimes.bike),
                  foot: formatDurationFromSeconds(destinationTravelTimes.foot),
                }}
              />

              {groupLocations.map(([clerkId, { lat, lng }]) => (
                <Marker
                  key={clerkId}
                  position={[lat, lng]}
                  icon={createAvatarIcon(
                    members?.find((m) => m.clerkId === clerkId)?.avatar,
                    members?.find((m) => m.clerkId === clerkId)?.isOnline || false,
                    false
                  )}
                >
                  <Popup>
                    <div className="space-y-1">
                      <div>
                        {members?.find((m) => m.clerkId === clerkId)?.name ||
                          clerkId}{" "}
                        -{" "}
                        {members?.find((m) => m.clerkId === clerkId)?.isOnline
                          ? "Online"
                          : "Offline"}
                      </div>
                      {srcCoords && (
                        <div className="text-xs text-muted-foreground">
                          {getProgressLabel(lat, lng)}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>

        {mapReady && (
          <button
            type="button"
            disabled={!canLocateUser}
            onClick={(e) => {
              e.stopPropagation();
              mapRef.current?.flyTo(userPos, 17, { animate: true, duration: 1.1 });
            }}
            className="pointer-events-auto absolute bottom-[52px] right-3 z-[100] flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/95 text-primary shadow-md backdrop-blur-sm transition hover:bg-muted/90 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Zoom to my location"
            title="My location"
          >
            <LocateFixed className="h-5 w-5" strokeWidth={2.25} />
          </button>
        )}

        {isLoading && <LoadingOverlay />}
      </div>
    </div>
  );
}