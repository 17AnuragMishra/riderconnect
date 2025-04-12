"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useUser } from "@clerk/nextjs";
import L from 'leaflet';

interface MapComponentProps {
  location: { latitude: number; longitude: number };
  groupLocations: [string, { lat: number; lng: number; isOnline: boolean }][];
  members?: { clerkId: string; name: string; avatar?: string }[];
}

function MapUpdater({ center, locations }: { center: L.LatLngTuple; locations: [string, { lat: number; lng: number; isOnline: boolean }][] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([center]);
    locations.forEach(([, { lat, lng }]) => bounds.extend([lat, lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, center, locations]);
  return null;
}

function createAvatarIcon(avatarUrl?: string, isOnline?: boolean) {
  return L.divIcon({
    html: `
      <div style="width: 32px; height: 32px; border-radius: 50%; overflow: hidden; border: 2px solid ${isOnline ? '#00ff00' : '#ff0000'};">
        <img src="${avatarUrl || '/default-avatar.png'}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    `,
    className: '', // Remove default Leaflet styling
    iconSize: [32, 32],
    iconAnchor: [16, 16], // Center the icon
  });
}

export default function MapComponent({ location, groupLocations, members }: MapComponentProps) {
  const position: L.LatLngTuple = [location.latitude, location.longitude];
  const { user, isLoaded } = useUser();
  return (
    <MapContainer center={position} scrollWheelZoom={true} style={{ height: '550px', width: '100%' }}>
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={position} locations={groupLocations} />
      <Marker position={position} icon={createAvatarIcon(members?.find(m => m.clerkId === user?.id)?.avatar, true)}>
        <Popup>Your Location</Popup>
      </Marker>
      {groupLocations.map(([clerkId, { lat, lng, isOnline }]) => (
        <Marker
          key={clerkId}
          position={[lat, lng] as L.LatLngTuple}
          icon={createAvatarIcon(members?.find(m => m.clerkId === clerkId)?.avatar, isOnline)}
        >
          <Popup>
            {members?.find(m => m.clerkId === clerkId)?.name || clerkId} - {isOnline ? 'Online' : 'Offline'}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

// import React, { useRef } from "react";
// import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import { Wifi, WifiOff, MapPin } from "lucide-react";
// import { useGroups } from "@/contexts/group-context";
// import { useParams } from "react-router-dom";

// const MapComponent = () => {
//     const mapRef = useRef(null);
//     const params = useParams();
//     const { getGroup } = useGroups();
//     const groupId = params.id;
//     const group = getGroup(groupId);

//     return (
//         <div className="relative w-full h-[60vh] bg-muted rounded-lg overflow-hidden" ref={mapRef}>
//             {/* This would be replaced with an actual map component */}
//             <div className="absolute inset-0 flex items-center justify-center">
//                 <div className="text-center p-4">
//                     <MapPin className="h-10 w-10 text-primary mx-auto mb-2" />
//                     <p className="font-medium">Map would render here with real-time locations</p>
//                     <p className="text-sm text-muted-foreground mt-2">Using Mapbox or Google Maps API</p>
//                 </div>
//             </div>

//             {/* Sample map markers */}
//             <TooltipProvider>
//                 {group?.members.map((member, index) => (
//                     <Tooltip key={member.id}>
//                         <TooltipTrigger asChild>
//                             <div
//                                 className={`absolute w-10 h-10 rounded-full border-2 ${member.isOnline ? "border-primary" : "border-muted-foreground"} transform -translate-x-1/2 -translate-y-1/2 cursor-pointer`}
//                                 style={{
//                                     left: `${20 + index * 15}%`,
//                                     top: `${30 + index * 10}%`,
//                                 }}
//                             >
//                                 <Avatar className="h-full w-full">
//                                     <AvatarImage src={member.avatar} alt={member.name} />
//                                     <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
//                                 </Avatar>
//                                 {!member.isOnline && (
//                                     <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive" />
//                                 )}
//                             </div>
//                         </TooltipTrigger>
//                         <TooltipContent>
//                             <div className="text-sm">
//                                 <p className="font-medium">
//                                     {member.name} {member.isYou && "(You)"}
//                                 </p>
//                                 <p className="text-xs text-muted-foreground">
//                                     {member.isOnline ? (
//                                         <span className="flex items-center gap-1">
//                                             <Wifi className="h-3 w-3 text-primary" /> Online
//                                         </span>
//                                     ) : (
//                                         <span className="flex items-center gap-1">
//                                             <WifiOff className="h-3 w-3 text-destructive" /> Offline
//                                         </span>
//                                     )}
//                                 </p>
//                             </div>
//                         </TooltipContent>
//                     </Tooltip>
//                 ))}
//             </TooltipProvider>
//         </div>
//     );
// };

// export default MapComponent;