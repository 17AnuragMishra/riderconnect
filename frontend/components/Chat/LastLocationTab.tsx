"use client";

import React, { useMemo } from "react";
import { AlertTriangle, MapPin, WifiOff } from "lucide-react";
import { calculateDistance } from "@/lib/utils";

interface LastLocationTabProps {
    members: any[];
    groupLocations: { clerkId: string; lat: number; lng: number; lastUpdated?: string }[];
    distanceThreshold: number;
    onViewLocation: (lat: number, lng: number) => void;
    currentUserCoords: { lat: number; lng: number } | null;
}

export function LastLocationTab({
    members,
    groupLocations,
    distanceThreshold,
    onViewLocation,
    currentUserCoords,
}: LastLocationTabProps) {
    // Find users who are offline or out of bounds
    const flaggedUsers = useMemo(() => {
        const flagged: any[] = [];

        members.forEach((member) => {
            const loc = groupLocations.find((l) => l.clerkId === member.clerkId);
            if (!loc || !loc.lat || !loc.lng) return;

            const isOffline = !member.isOnline;

            let isOutOfBounds = false;
            let distance = 0;
            if (currentUserCoords?.lat && currentUserCoords?.lng) {
                distance = calculateDistance(
                    currentUserCoords.lat,
                    currentUserCoords.lng,
                    loc.lat,
                    loc.lng
                );
                if (distance > distanceThreshold) {
                    isOutOfBounds = true;
                }
            }

            if (isOffline || isOutOfBounds) {
                flagged.push({
                    member,
                    loc,
                    reason: isOffline ? "offline" : "threshold",
                    distance,
                });
            }
        });

        return flagged;
    }, [members, groupLocations, distanceThreshold, currentUserCoords]);

    if (flaggedUsers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                <MapPin className="h-12 w-12 mb-4 opacity-20" />
                <p>No offline or out-of-bounds riders.</p>
                <p className="text-sm">Everyone is nearby and online.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 p-4 h-[70vh] overflow-y-auto w-full max-w-3xl mx-auto pb-10">
            {flaggedUsers.map(({ member, loc, reason, distance }, idx) => {
                const isOffline = reason === "offline";
                const Icon = isOffline ? WifiOff : AlertTriangle;
                const accentColor = isOffline ? "#ef4444" : "#f59e0b";
                const darkAccent = isOffline ? "#991b1b" : "#b45309";
                const bgGradient = isOffline
                    ? "linear-gradient(145deg, rgba(45,10,10,0.95), rgba(26,5,5,0.98))"
                    : "linear-gradient(145deg, rgba(45,31,0,0.95), rgba(26,16,0,0.98))";
                const borderColor = isOffline ? "rgba(239,68,68,0.4)" : "rgba(245,158,11,0.4)";
                const badgeText = isOffline ? "OFFLINE" : "THRESHOLD EXCEEDED";

                return (
                    <div
                        key={`${member.clerkId}-${idx}`}
                        className="flex-shrink-0 relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.01]"
                        style={{
                            background: bgGradient,
                            border: `1px solid ${borderColor}`,
                            boxShadow: `0 8px 32px ${isOffline ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)"}`,
                            backdropFilter: "blur(12px)",
                        }}
                    >
                        {/* Header stripe */}
                        <div
                            className="flex items-center justify-between px-5 py-3"
                            style={{
                                background: `linear-gradient(90deg, ${accentColor}1A, ${accentColor}33, ${accentColor}1A)`,
                                borderBottom: `1px solid ${borderColor}`,
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <Icon size={16} strokeWidth={2.5} style={{ color: accentColor }} />
                                <span
                                    className="text-xs font-bold tracking-widest"
                                    style={{ color: accentColor }}
                                >
                                    {badgeText}
                                </span>
                            </div>
                            {loc.lastUpdated && (
                                <span className="text-xs font-mono text-gray-400">
                                    {new Date(loc.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>

                        {/* Body */}
                        <div className="p-6 flex flex-col gap-5">
                            <div>
                                <h3 className="text-xl font-bold text-gray-100 mb-1">{member.name}</h3>
                                <p className="text-sm text-gray-400">
                                    {isOffline
                                        ? "Last known location captured before disconnecting"
                                        : `Currently ${(distance / 1000).toFixed(1)} km away from you`}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                                <div
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10"
                                    style={{ background: "rgba(0,0,0,0.4)" }}
                                >
                                    <MapPin size={18} style={{ color: accentColor }} />
                                    <span className="text-sm font-mono text-gray-300 tracking-wider">
                                        {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                                    </span>
                                </div>

                                <button
                                    onClick={() => onViewLocation(loc.lat, loc.lng)}
                                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all w-full sm:w-auto hover:brightness-110 active:scale-95"
                                    style={{
                                        background: `linear-gradient(135deg, ${accentColor}, ${darkAccent})`,
                                        boxShadow: `0 4px 12px ${accentColor}40`,
                                        border: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    <MapPin size={18} />
                                    View on Map
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
