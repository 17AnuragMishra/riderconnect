import React, { useRef } from "react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Wifi, WifiOff, MapPin } from "lucide-react";
import { useGroups } from "@/contexts/group-context";
import { useParams } from "react-router-dom";

const MapComponent = () => {
    const mapRef = useRef(null);
    const params = useParams();
    const { getGroup } = useGroups();
    const groupId = params.id;
    const group = getGroup(groupId);

    return (
        <div className="relative w-full h-[60vh] bg-muted rounded-lg overflow-hidden" ref={mapRef}>
            {/* This would be replaced with an actual map component */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-4">
                    <MapPin className="h-10 w-10 text-primary mx-auto mb-2" />
                    <p className="font-medium">Map would render here with real-time locations</p>
                    <p className="text-sm text-muted-foreground mt-2">Using Mapbox or Google Maps API</p>
                </div>
            </div>

            {/* Sample map markers */}
            <TooltipProvider>
                {group?.members.map((member, index) => (
                    <Tooltip key={member.id}>
                        <TooltipTrigger asChild>
                            <div
                                className={`absolute w-10 h-10 rounded-full border-2 ${member.isOnline ? "border-primary" : "border-muted-foreground"} transform -translate-x-1/2 -translate-y-1/2 cursor-pointer`}
                                style={{
                                    left: `${20 + index * 15}%`,
                                    top: `${30 + index * 10}%`,
                                }}
                            >
                                <Avatar className="h-full w-full">
                                    <AvatarImage src={member.avatar} alt={member.name} />
                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {!member.isOnline && (
                                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive" />
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-sm">
                                <p className="font-medium">
                                    {member.name} {member.isYou && "(You)"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {member.isOnline ? (
                                        <span className="flex items-center gap-1">
                                            <Wifi className="h-3 w-3 text-primary" /> Online
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <WifiOff className="h-3 w-3 text-destructive" /> Offline
                                        </span>
                                    )}
                                </p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
        </div>
    );
};

export default MapComponent;