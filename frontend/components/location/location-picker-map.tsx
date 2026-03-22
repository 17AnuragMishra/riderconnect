"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getBestCurrentLocation } from "@/lib/geolocation";
import { parseCoordinatesFromLocationInput } from "@/lib/locationParsing";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type LatLng = { lat: number; lng: number };

interface LocationPickerMapProps {
  initialValue?: string;
  apiKey?: string;
  onSelect: (payload: { lat: number; lng: number; label?: string }) => void;
}

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

function MapClickHandler({
  onPick,
}: {
  onPick: (coords: LatLng) => void;
}) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

function FlyToLocation({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [map, center]);

  return null;
}

export default function LocationPickerMap({
  initialValue,
  apiKey,
  onSelect,
}: LocationPickerMapProps) {
  const parsedInitial = useMemo(
    () => parseCoordinatesFromLocationInput(initialValue || ""),
    [initialValue]
  );

  const [selected, setSelected] = useState<LatLng | null>(
    parsedInitial ? { lat: parsedInitial.lat, lng: parsedInitial.lng } : null
  );
  const [center, setCenter] = useState<[number, number]>(
    parsedInitial ? [parsedInitial.lat, parsedInitial.lng] : INDIA_CENTER
  );
  const [label, setLabel] = useState<string>("");
  const [isFetchingCurrent, setIsFetchingCurrent] = useState(false);

  useEffect(() => {
    const parsed = parseCoordinatesFromLocationInput(initialValue || "");
    if (parsed) {
      setSelected({ lat: parsed.lat, lng: parsed.lng });
      setCenter([parsed.lat, parsed.lng]);
    }
  }, [initialValue]);

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!apiKey) {
      setLabel("");
      return;
    }

    try {
      const url = `https://api.locationiq.com/v1/reverse?key=${apiKey}&lat=${lat}&lon=${lng}&format=json`;
      const response = await fetch(url);
      if (!response.ok) {
        setLabel("");
        return;
      }

      const data = await response.json();
      setLabel(typeof data?.display_name === "string" ? data.display_name : "");
    } catch {
      setLabel("");
    }
  };

  const handlePick = async (coords: LatLng) => {
    setSelected(coords);
    await reverseGeocode(coords.lat, coords.lng);
  };

  const useMyLocation = async () => {
    setIsFetchingCurrent(true);
    try {
      const best = await getBestCurrentLocation({
        desiredAccuracy: 35,
        maxWaitMs: 12000,
        minimumSamples: 2,
        maximumAge: 0,
      });

      const current: LatLng = { lat: best.latitude, lng: best.longitude };
      setCenter([current.lat, current.lng]);
      await handlePick(current);
    } finally {
      setIsFetchingCurrent(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Tap on the map to pin an exact location.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={useMyLocation}
          disabled={isFetchingCurrent}
        >
          {isFetchingCurrent ? "Locating..." : "Use My Location"}
        </Button>
      </div>

      <div className="h-[320px] w-full overflow-hidden rounded-md border">
        <MapContainer
          center={center}
          zoom={parsedInitial ? 15 : 5}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onPick={handlePick} />
          <FlyToLocation center={center} />

          {selected && (
            <CircleMarker
              center={[selected.lat, selected.lng]}
              radius={9}
              pathOptions={{ color: "hsl(var(--primary))", fillOpacity: 0.8 }}
            />
          )}
        </MapContainer>
      </div>

      <div className="space-y-1 rounded-md border p-2 text-xs">
        <div className="font-medium">Selected Coordinates</div>
        <div className="text-muted-foreground">
          {selected
            ? `${selected.lat.toFixed(6)}, ${selected.lng.toFixed(6)}`
            : "No location selected"}
        </div>
        {label && <div className="text-muted-foreground line-clamp-2">{label}</div>}
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={!selected}
        onClick={() => {
          if (!selected) return;
          onSelect({ lat: selected.lat, lng: selected.lng, label });
        }}
      >
        Use Selected Location
      </Button>
    </div>
  );
}