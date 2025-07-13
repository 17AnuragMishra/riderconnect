"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Use Shadcn/UI Avatar
import { Card, CardContent } from "@/components/ui/card";
import { Wifi, WifiOff } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";

interface Member {
  clerkId: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

interface Group {
  _id: string;
  members: Member[];
}

interface MemberTabProps {
  group: Group;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const socket: Socket = io(API_BASE_URL, { autoConnect: false });

export default function MemberTab({ group }: MemberTabProps) {
  const { user, isLoaded } = useUser();
  const [members, setMembers] = useState<Member[]>(group.members);
  const [statusReceived, setStatusReceived] = useState(false);

  useEffect(() => {
    if (!isLoaded || !group.members.length) return;

    // Initialize members with current group data
    setMembers(group.members);

    const checkMemberStatuses = async () => {
      try {
        // Connect to socket for real-time updates
        socket.connect();
        
        // Join the group room
        socket.emit("join", { clerkId: user?.id, groupId: group._id });
        
        // Request initial status update
        socket.emit("requestStatusUpdate", { groupId: group._id });
        
        // Set up heartbeat for online status
        const heartbeatInterval = setInterval(() => {
          if (user?.id) {
            socket.emit("heartbeat", { clerkId: user.id, groupId: group._id });
          }
        }, 10000);

        setStatusReceived(true);

        return () => {
          clearInterval(heartbeatInterval);
          socket.disconnect();
        };
      } catch (error) {
        console.error("Error checking member statuses:", error);
        setStatusReceived(true);
      }
    };

    const cleanup = checkMemberStatuses();

    // Listen for member status updates
    socket.on("memberStatusUpdate", (updatedMembers: Member[]) => {
      if (Array.isArray(updatedMembers)) {
        setMembers(updatedMembers);
      }
    });

    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.());
      socket.off("memberStatusUpdate");
    };
  }, [isLoaded, group.members, group._id, user?.id]);

  // Update members when group prop changes
  useEffect(() => {
    setMembers(group.members);
  }, [group.members]);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-200px)]">
      <h2 className="text-xl font-bold mb-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2">
        Group Members ({members.length})
      </h2>
      
      {!statusReceived ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading member statuses...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {members.map((member: Member) => (
            <Card key={member.clerkId} className="transition-all duration-200 hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{member.name}</h3>
                      {member.clerkId === user?.id && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">(You)</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {member.isOnline ? (
                        <>
                          <Wifi className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="text-green-600">Online</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3 text-red-500 flex-shrink-0" />
                          <span className="text-red-600">Offline</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
