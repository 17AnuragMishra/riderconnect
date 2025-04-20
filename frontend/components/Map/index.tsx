"use client";

import { useEffect, useState } from "react";
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
import "leaflet-fullscreen/dist/Leaflet.fullscreen.css";
import { useUser } from "@clerk/nextjs";
import L from "leaflet";
import "leaflet-fullscreen";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface MapComponentProps {
  location: { latitude: number; longitude: number };
  groupLocations: [string, { lat: number; lng: number }][];
  members?: { clerkId: string; name: string; avatar?: string; isOnline?: boolean }[];
  source: string;
  destination: string;
}

type LatLng = [number, number];

function createAvatarIcon(avatarUrl?: string, isOnline: boolean = false) {
  return L.divIcon({
    html: `
      <div style="width: 32px; height: 32px; border-radius: 50%; overflow: hidden; border: 2px solid ${
        isOnline ? "#00ff00" : "#ff0000"
      };">
        <img src="${avatarUrl || "/default-avatar.png"}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    `,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
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
}: {
  center: L.LatLngTuple;
  locations: [string, { lat: number; lng: number }][];
}) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([center]);
    locations.forEach(([, { lat, lng }]) => bounds.extend([lat, lng]));
    map.fitBounds(bounds, { padding: [100, 100] });
  }, [map, center, locations]);
  return null;
}

export default function MapComponent({
  location,
  groupLocations,
  members,
  source,
  destination,
}: MapComponentProps) {
  const { user } = useUser();
  const userPos: LatLng = [location.latitude, location.longitude];
  
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [srcCoords, setSrcCoords] = useState<LatLng | null>(null);
  const [dstCoords, setDstCoords] = useState<LatLng | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  async function fetchCoordinates(place: string): Promise<LatLng | null> {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        place
      )}`
    );
    const data = await res.json();
    if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    return null;
  }

  async function fetchRoute(from: LatLng, to: LatLng) {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates.map(
        ([lng, lat]: number[]) => [lat, lng]
      );
      setRouteCoords(coords);
    }
  }

  useEffect(() => {
    async function getRoute() {
      setIsLoading(true);
      setLoadingProgress(10);
      
      try {
        const from = await fetchCoordinates(source);
        setLoadingProgress(40);
        
        const to = await fetchCoordinates(destination);
        setLoadingProgress(70);
        
        if (from && to) {
          setSrcCoords(from);
          setDstCoords(to);
          await fetchRoute(from, to);
          setLoadingProgress(100);
        }
      } catch (error) {
        console.error("Error loading map data:", error);
      } finally {
        // Slight delay to show the completed progress before hiding
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    }
    getRoute();
  }, [source, destination]);

  const LoadingOverlay = () => (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm dark:bg-background/90 bg-grid-pattern" style={{ height: '100%', width: '100%' }}>
      <div className="animate-pulse-gentle flex flex-col items-center space-y-4 p-6 max-w-xs w-full">
        <div className="shadow-glow rounded-lg bg-card p-4 w-full">
          <div className="text-center mb-3 text-sm font-medium text-primary">Loading Map Data</div>
          <Progress value={loadingProgress} className="h-2 w-full" />
          <div className="mt-2 text-xs text-muted-foreground text-center">
            {loadingProgress < 100 ? 'Fetching route information...' : 'Rendering map...'}
          </div>
        </div>
      </div>
    </div>
  );
  // Force Leaflet to update after container size changes
  useEffect(() => {
    const handleResize = () => {
      window.dispatchEvent(new Event('resize'));
    };
    
    window.addEventListener('resize', handleResize);
    
    // Trigger resize event after component mounts to ensure map renders properly
    const timeoutId = setTimeout(handleResize, 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

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
    <div className="relative w-full min-h-[350px] xs:min-h-[450px] sm:min-h-[500px] md:min-h-[70vh] lg:min-h-[70vh]">
      <div 
        className={cn(
          "map-container h-full transition-all duration-300 ease-in-out relative shadow-md rounded-lg overflow-hidden",
          "bg-muted/30 dark:bg-muted/10",
          "touch-optimized"
        )}
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          minHeight: 'inherit'
        }}
      >
        <MapContainer 
          center={userPos} 
          scrollWheelZoom={true} 
          className="h-full w-full z-10"
          zoomAnimation={true}
          fadeAnimation={true}
          markerZoomAnimation={true}
          zoomControl={false} // Disable default zoom control so we can position it better
          style={{ 
            height: '100%', 
            width: '100%', 
            minHeight: 'inherit',
            position: 'relative' 
          }}
          fullscreenControl={true}
        >
          {/* Add map controls */}
          <ZoomControl position="topright" />
          <ScaleControl position="bottomright" metric={true} imperial={false} />
          
          {/* Layer control to switch between different map styles */}
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
      <MapUpdater center={userPos} locations={groupLocations} />

      {srcCoords && (
        <Marker position={srcCoords} icon={blueIcon}>
          <Popup>Source</Popup>
        </Marker>
      )}

      {dstCoords && (
        <Marker position={dstCoords} icon={redIcon}>
          <Popup>Destination</Popup>
        </Marker>
      )}

      {routeCoords.length > 0 && (
        <Polyline positions={routeCoords} pathOptions={{ color: "blue" }} />
      )}

      <Marker
        position={userPos}
        icon={createAvatarIcon(
          members?.find((m) => m.clerkId === user?.id)?.avatar,
          members?.find((m) => m.clerkId === user?.id)?.isOnline || false
        )}
      >
        <Popup>Your Location</Popup>
      </Marker>

      {groupLocations.map(([clerkId, { lat, lng }]) => (
        <Marker
          key={clerkId}
          position={[lat, lng]}
          icon={createAvatarIcon(
            members?.find((m) => m.clerkId === clerkId)?.avatar,
            members?.find((m) => m.clerkId === clerkId)?.isOnline || false
          )}
        >
          <Popup>
            {members?.find((m) => m.clerkId === clerkId)?.name || clerkId} -{" "}
            {members?.find((m) => m.clerkId === clerkId)?.isOnline ? "Online" : "Offline"}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
    
    {isLoading && <LoadingOverlay />}
      </div>
    </div>
  );
}