"use client";

import "../[id]/chat.css";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Info, MapPin, MessageSquare, Users, Settings, Copy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useUser } from "@clerk/nextjs";
import { useGroups } from "@/contexts/group-context";
import { useToast } from "@/hooks/use-toast";
import MapComponent from "@/components/Map";
import ChatTab from "@/components/Chat/ChatTab";
import MemberTab from "@/components/Member/MemberTab";
import axios from "axios";
import io from "socket.io-client";
import { BackgroundBeams } from "@/components/ui/background-beams";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const socket = io(API_BASE_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

interface Message {
  _id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

interface Member {
  clerkId: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

interface Group {
  _id: string;
  name: string;
  code: string;
  source: string;
  destination: string;
  members: Member[];
  startTime: string;
  reachTime: string;
  isActive: boolean;
  createdBy: string;
  distanceThreshold?: number;
}

export default function GroupPage() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const { getGroup, updateGroupSettings } = useGroups();
  const { toast } = useToast();
  const groupId = params?.id
    ? Array.isArray(params.id)
      ? params.id[0]
      : params.id
    : null;

  if (!groupId) {
    toast({
      title: "Error",
      description: "Invalid group ID",
      variant: "destructive",
    });
    router.push("/dashboard");
    return null;
  }

  const [group, setGroup] = useState<Group | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [distanceThreshold, setDistanceThreshold] = useState(1000);
  const [originalThreshold, setOriginalThreshold] = useState(1000);
  const [shareLocation, setShareLocation] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [groupLocations, setGroupLocations] = useState<
    Map<string, { lat: number; lng: number }>
  >(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !groupId || !isLoaded) return;

    const fetchGroup = async () => {
      setIsFetching(true);
      try {
        let fetchedGroup: Group | null = getGroup(groupId);
        if (!fetchedGroup) {
          const res = await axios.get(
            `${API_BASE_URL}/groups?clerkId=${user.id}`
          );
          fetchedGroup = res.data.find((g: Group) => g._id === groupId) || null;
        }
        if (!fetchedGroup) {
          toast({
            title: "Error",
            description: "Group not found",
            variant: "destructive",
          });
          router.push("/dashboard");
          return;
        }
        setGroup(fetchedGroup);
        setDistanceThreshold(fetchedGroup.distanceThreshold || 1000);
        setOriginalThreshold(fetchedGroup.distanceThreshold || 1000);
      } catch (err) {
        console.error("Failed to fetch group:", err);
        toast({
          title: "Error",
          description: "Failed to load group",
          variant: "destructive",
        });
        router.push("/dashboard");
      } finally {
        setIsFetching(false);
      }
    };

    fetchGroup();
  }, [user, groupId, isLoaded, getGroup, toast, router]);

  useEffect(() => {
    if (!user || !groupId || !isLoaded) return;
    if (activeTab === "chat") {
      socket.emit("viewingGroup", { groupId, clerkId: user.id });
    }
  }, [activeTab, user, groupId, isLoaded]);

  useEffect(() => {
    if (!user || !groupId || !shareLocation || !isLoaded) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        socket.emit("updateLocation", {
          groupId,
          clerkId: user.id,
          lat: latitude,
          lng: longitude,
        });
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, groupId, shareLocation, isLoaded]);

  useEffect(() => {
    if (!user || !groupId || !isLoaded) return;

    socket.on("groupLocations", (locations: { clerkId: string; lat: number; lng: number }[]) => {
      const locationMap = new Map();
      locations.forEach((loc) => {
        if (loc.lat && loc.lng) {
          locationMap.set(loc.clerkId, { lat: loc.lat, lng: loc.lng });
        }
      });
      setGroupLocations(locationMap);
    });

    socket.on("locationUpdate", (location: { clerkId: string; lat: number; lng: number }) => {
      if (location.lat && location.lng) {
        setGroupLocations((prev) => new Map(prev).set(location.clerkId, { lat: location.lat, lng: location.lng }));
      }
    });

    const toastCooldown = new Map();
    socket.on("distanceAlert", ({ clerkId, otherClerkId, distance }) => {
      if (clerkId === user.id || otherClerkId === user.id) {
        const alertKey = `${clerkId}-${otherClerkId}`;
        const lastToast = toastCooldown.get(alertKey) || 0;
        const now = Date.now();
        if (now - lastToast > 60000) {
          const otherName =
            group?.members.find((m) => m.clerkId === otherClerkId)?.name ||
            otherClerkId;
          toast({
            title: "Distance Alert",
            description: `You are ${Math.round(
              distance / 1000
            )} km away from ${otherName}`,
            variant: "destructive",
          });
          toastCooldown.set(alertKey, now);
        }
      }
    });

    return () => {
      socket.off("groupLocations");
      socket.off("locationUpdate");
      socket.off("distanceAlert");
    };
  }, [user, groupId, isLoaded, group, toast]);

  useEffect(() => {
    if (!user || !groupId) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/groups/messages/group/${groupId}`
        );
        setMessages(res.data.data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      }
    };
    fetchMessages();
    socket.connect();

    socket.on("connect", () => {
      socket.emit("join", { clerkId: user.id, groupId });
      socket.emit("requestStatusUpdate", { groupId });
      const heartbeatInterval = setInterval(() => {
        socket.emit("heartbeat", { clerkId: user.id, groupId });
      }, 10000);

      socket.on("disconnect", () => {
        clearInterval(heartbeatInterval);
      });
    });

    socket.on("reconnect", (attempt) => {
      socket.emit("join", { clerkId: user.id, groupId });
      socket.emit("requestStatusUpdate", { groupId });
    });

    socket.on("connect_error", (err) => {
      toast({
        title: "Connection Error",
        description: `Failed to connect to server: ${err.message}. Retrying...`,
        variant: "destructive",
      });
    });

    socket.on("receiveMessage", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("memberStatusUpdate", (updatedMembers: Member[]) => {
      if (Array.isArray(updatedMembers)) {
        setGroup((prevGroup) => {
          if (!prevGroup) return prevGroup;
          const newMembers = updatedMembers.map((m) => ({ ...m }));
          return { ...prevGroup, members: newMembers };
        });
      } else {
        socket.emit("requestStatusUpdate", { groupId });
      }
    });

    socket.on("error", (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    });

    return () => {
      socket.off("connect");
      socket.off("reconnect");
      socket.off("connect_error");
      socket.off("receiveMessage");
      socket.off("memberStatusUpdate");
      socket.off("error");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [user, groupId, toast]);

  useEffect(() => {
    if (messagesEndRef.current && activeTab === "chat") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const messageData = {
      groupId,
      clerkId: user.id,
      clerkName: user.firstName || "User",
      content: newMessage,
    };

    socket.emit("sendMessage", messageData);
    setNewMessage("");
  };

  useEffect(() => {
    if (!user || !groupId || !isLoaded) return;

    socket.on("newMessageNotification", ({ message, for: targetClerkId }) => {
      if (targetClerkId === user.id) {
        toast({
          title: `New Message in ${group?.name}`,
          description: message.content,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("chat")}
            >
              View
            </Button>
          ),
        });
      }
    });

    return () => {
      socket.off("newMessageNotification");
    };
  }, [user, groupId, group?.name, isLoaded, toast]);

  const handleSaveSettings = async () => {
    if (!user || !group || !groupId) return;
    setIsSaving(true);
    try {
      const response = await axios.patch(`${API_BASE_URL}/groups/distanceThreshold`, {
        groupId,
        distanceThreshold,
        clerkId: user.id,
      });
      const updatedGroup = response.data.data;
      await updateGroupSettings(groupId, { distanceThreshold });
      setGroup(updatedGroup);
      setOriginalThreshold(distanceThreshold);
      setSettingsDialogOpen(false);
      toast({
        title: "Success",
        description: `Distance threshold updated to ${distanceThreshold} meters`,
      });
    } catch (error: any) {
      console.error("Error updating distance threshold:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update distance threshold",
        variant: "destructive",
      });
      setDistanceThreshold(originalThreshold);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDistanceThreshold(originalThreshold);
    setSettingsDialogOpen(false);
  };

  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast({ title: "Copied!", description: successMessage }),
      () =>
        toast({
          title: "Error",
          description: "Failed to copy",
          variant: "destructive",
        })
    );
  };

  if (!isLoaded || isFetching) {
    return (
      <div className="flex max-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="flex max-h-screen flex-col">
      <header className="sticky top-16 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <MapPin className="h-5 w-5 text-primary" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">{group.name}</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary transition" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-[#192643] ml-3 mt-2 z-[9999] text-white shadow-lg p-4 rounded-lg border border-gray-700 max-w-[90vw] sm:max-w-[400px] text-sm space-y-2"
                  >
                    <div>
                      <p className="font-semibold text-gray-300 text-base sm:text-sm">
                        Ride Info
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:gap-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-[2px]" />
                        <p className="text-sm sm:text-xs break-words">
                          <span className="font-medium">From:</span>{" "}
                          {group.source}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-[2px]" />
                        <p className="text-sm sm:text-xs break-words">
                          <span className="font-medium">To:</span>{" "}
                          {group.destination}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-gray-400 mt-[2px]" />
                        <p className="text-sm sm:text-xs">
                          <span className="font-medium">
                            {group.members.length}
                          </span>{" "}
                          {group.members.length === 1 ? "member" : "members"}
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Invite</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite People to {group.name}</DialogTitle>
                  <DialogDescription>
                    Share this code or link to invite others.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Invite Code</Label>
                    <div className="flex items-center gap-2">
                      <Input value={group.code} readOnly />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(group.code, "Invite code copied!")
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setInviteDialogOpen(false)}>
                    Done
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog
              open={settingsDialogOpen}
              onOpenChange={setSettingsDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Group Settings</DialogTitle>
                  <DialogDescription>
                    Configure tracking and notification settings.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>
                      Distance Threshold ({distanceThreshold} meters)
                    </Label>
                    <Slider
                      value={[distanceThreshold]}
                      min={100}
                      max={2000}
                      step={100}
                      onValueChange={(value) => setDistanceThreshold(value[0])}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Settings"}
                  </Button>
                  <Button onClick={handleCancel} variant="outline">
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b">
            <div className="container flex items-center justify-center">
              <TabsList className="h-12">
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Map</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat</span>
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Members</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          {/* Optional: Uncomment if BackgroundBeams is needed */}
          <BackgroundBeams className="pointer-events-none" /> 
          <div className="container py-6 px-4">
            <TabsContent value="map" className="mt-0">
              {location ? (
                <MapComponent
                  location={location}
                  groupLocations={Array.from(groupLocations.entries())}
                  members={group?.members}
                  source={group?.source}
                  destination={group?.destination}
                />
              ) : (
                <p>Loading map...</p>
              )}
            </TabsContent>
            <TabsContent value="chat" className="mt-0">
              <ChatTab members={group.members} groupId={groupId} />
            </TabsContent>
            <TabsContent value="members" className="mt-0">
              <MemberTab group={group} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}