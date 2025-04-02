"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";
import "leaflet-defaulticon-compatibility";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useMemo } from "react";

// interface MapComponentProps {
//   locations: any[];
// }

export default function MapComponent({ location }) {
  const mapRef = useRef<HTMLDivElement>(null);
  
  const position = useMemo(() => [location.latitude, location.longitude], [location]);

  // useEffect(() => {
  //   // Mock map rendering (replace with real Mapbox/Google Maps integration)
  //   if (mapRef.current) {
  //     console.log("Map updated with locations:", locations);
  //     locations.forEach((loc) => {
  //       // Simulate avatar rendering with red circle if offline
  //       console.log(`${loc.clerkId} at (${loc.latitude}, ${loc.longitude}), ${loc.isOnline ? "online" : "offline with red circle"}`);
  //     });
  //   }
  // }, [locations]);

//   var myIcon = L.icon({
//     iconUrl: {},
//     iconSize: [38, 95],
//     iconAnchor: [22, 94],
//     popupAnchor: [-3, -76],
//     shadowUrl: '',
//     shadowSize: [68, 95],
//     shadowAnchor: [22, 94]
// });

  return (
      <MapContainer
        center={position}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            Your Location.
          </Popup>
        </Marker>
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