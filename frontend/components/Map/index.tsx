"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useUser } from "@clerk/nextjs";
import L from "leaflet";

interface MapComponentProps {
  location: { latitude: number; longitude: number };
  groupLocations: [string, { lat: number; lng: number; isOnline: boolean }][];
  members?: { clerkId: string; name: string; avatar?: string }[];
  source: string;
  destination: string;
}

type LatLng = [number, number];

function createAvatarIcon(avatarUrl?: string, isOnline?: boolean) {
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
  locations: [string, { lat: number; lng: number; isOnline: boolean }][];
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
      const from = await fetchCoordinates(source);
      const to = await fetchCoordinates(destination);
      if (from && to) {
        setSrcCoords(from);
        setDstCoords(to);
        await fetchRoute(from, to);
      }
    }
    getRoute();
  }, [source, destination]);

  return (
    <MapContainer center={userPos} scrollWheelZoom={true} style={{ height: "350px", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={userPos} locations={groupLocations} />

      {/* 🔵 Source Marker */}
      {srcCoords && (
        <Marker position={srcCoords} icon={blueIcon}>
          <Popup>Source</Popup>
        </Marker>
      )}

      {/* 🔴 Destination Marker */}
      {dstCoords && (
        <Marker position={dstCoords} icon={redIcon}>
          <Popup>Destination</Popup>
        </Marker>
      )}

      {/* 🚗 Route Polyline */}
      {routeCoords.length > 0 && (
        <Polyline positions={routeCoords} pathOptions={{ color: "blue" }} />
      )}

      

      {/* 👥 Group Members */}
      {groupLocations.map(([clerkId, { lat, lng, isOnline }]) => (
        <Marker
          key={clerkId}
          position={[lat, lng]}
          icon={createAvatarIcon(
            members?.find((m) => m.clerkId === clerkId)?.avatar,
            isOnline
          )}
        >
          <Popup>
            {members?.find((m) => m.clerkId === clerkId)?.name || clerkId} -{" "}
            {isOnline ? "Online" : "Offline"}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
