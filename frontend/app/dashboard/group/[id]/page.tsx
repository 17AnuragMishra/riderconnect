"use client";

import "../[id]/chat.css";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";
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
import { Switch } from "@/components/ui/switch";
import {
  MapPin,
  MessageSquare,
  Users,
  Settings,
  Copy,
  Send,
  Wifi,
  WifiOff,
  WifiHighIcon,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useGroups } from "@/contexts/group-context";
import { useToast } from "@/hooks/use-toast";
import MapComponent from "@/components/Map";
import ChatTab from "@/components/Chat/ChatTab";
import axios from "axios";
import io from "socket.io-client";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { getMaxAge } from "next/dist/server/image-optimizer";

const socket = io(process.env.NEXT_PUBLIC_API_URL, {
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
  createdBy: string;
  distanceThreshold?: number;
}

export interface Notifications {
  heading: string;
  message: string;
  numberOfMessage: Int16Array;
  readState: boolean;
}

export default function GroupPage() {
  const { user, isLoaded, isSignedIn } = useUser();
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
  const [distanceThreshold, setDistanceThreshold] = useState<number>(500);
  const [autoNotify, setAutoNotify] = useState(true);
  const [shareLocation, setShareLocation] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [tagging, setTagging] = useState(false);
  const [space, setSpace] = useState(true);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [groupLocations, setGroupLocations] = useState<Map<string, { lat: number; lng: number; isOnline: boolean }>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!user || !groupId || !isLoaded) return;

    const fetchGroup = async () => {
      setIsFetching(true);
      console.log("Fetching group with ID:", groupId);
      try {
        let fetchedGroup = getGroup(groupId);
        console.log("Group from context:", fetchedGroup);
        if (!fetchedGroup) {
          const res = await axios.get(
            `${API_BASE_URL}/groups?clerkId=${user.id}`
          );
          console.log("Backend response:", res.data);
          fetchedGroup = res.data.find((g: Group) => g._id === groupId) || null;
          console.log("Found group from backend:", fetchedGroup);
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
        setDistanceThreshold(fetchedGroup?.distanceThreshold || 500);
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
    socket.on(
      "groupLocations",
      (
        locations: {
          clerkId: string;
          lat: number;
          lng: number;
          isOnline: boolean;
        }[]
      ) => {
        const locationMap = new Map();
        locations.forEach((loc) => {
          if (loc.lat && loc.lng) {
            locationMap.set(loc.clerkId, {
              lat: loc.lat,
              lng: loc.lng,
              isOnline: loc.isOnline,
            });
          }
        });
        setGroupLocations(locationMap);
      }
    );

    socket.on(
      "locationUpdate",
      (location: {
        clerkId: string;
        lat: number;
        lng: number;
        isOnline: boolean;
      }) => {
        if (location.lat && location.lng) {
          setGroupLocations((prev) =>
            new Map(prev).set(location.clerkId, {
              lat: location.lat,
              lng: location.lng,
              isOnline: location.isOnline,
            })
          );
        }
      }
    );

    const toastCooldown = new Map();
    socket.on("distanceAlert", ({ clerkId, otherClerkId, distance }) => {
      if (clerkId === user.id || otherClerkId === user.id) {
        const alertKey = `${clerkId}-${otherClerkId}`;
        const lastToast = toastCooldown.get(alertKey) || 0;
        const now = Date.now();
        if (now - lastToast > 60000) { 
          const otherName = group?.members.find(m => m.clerkId === otherClerkId)?.name || otherClerkId;
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
    if (isLoaded && !user) redirect("/sign-in");
  }, [isLoaded, user]);

  useEffect(() => {
    if (isLoaded && !isFetching && group === null) {
      toast({
        title: "Error",
        description: "Group not found",
        variant: "destructive",
      });
      router.push("/dashboard");
    }
  }, [isLoaded, isFetching, group, router, toast]);

  useEffect(() => {
    if (!user || !groupId || initialized.current) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/messages/group/${groupId}`
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
    console.log('Socket connected:', socket.connected); 
    socket.emit("join", { clerkId: user.id, groupId });

    socket.on("receiveMessage", (message: Message) => {
      console.log("Received message:", message);
      setMessages((prev) => [...prev, message]);
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('join', { clerkId: user.id, groupId });
      console.log('Emitted join:', { clerkId: user.id, groupId });
    });
    socket.on('connect_error', (err) => console.error('Socket connection error:', err));
  
    socket.on('memberStatusUpdate', (updatedMembers: Member[]) => {
      console.log('Received memberStatusUpdate:', updatedMembers);
      if (Array.isArray(updatedMembers)) {
        setGroup((prevGroup) => {
          if (!prevGroup) return prevGroup;
          console.log('Updating group members:', updatedMembers);
          return { ...prevGroup, members: updatedMembers };
        });
      } else {
        console.error('Invalid members data:', updatedMembers);
      }
    });
  
    socket.on('error', (err) => {
      console.error('Socket error:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    });
  
    initialized.current = true;
  
    return () => {
      socket.off('connect');
      socket.off('reconnect');
      socket.off('connect_error');
      socket.off('memberStatusUpdate');
      socket.off('error');
      socket.disconnect();
      initialized.current = false;
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

    console.log("Sending message:", messageData);
    socket.emit("sendMessage", messageData);
    setNewMessage("");
  };

  useEffect(() => {
    if (!user || !groupId || !isLoaded) return;

    socket.on("newMessageNotification", ({ message, for: targetClerkId }) => {
      console.log(`Received notification for ${targetClerkId}:`, message);
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
    if (!group || !groupId) return;
    setIsSaving(true);
    try {
      await updateGroupSettings(groupId, { distanceThreshold });
      toast({
        title: "Success",
        description: "Group settings updated successfully!",
      });
      setSettingsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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

  const LazyMap = dynamic(() => import("@/components/Map/index"), {
    ssr: false,
    loading: () => <p>Loading...</p>,
  });

  const checkingMessage = (e: any) => {
    if (e.target.value === newMessage + "@") {
      setTagging(true);
      setNewMessage(e.target.value);
      setSpace(false);
    } else {
      setTagging(false);
      setNewMessage(e.target.value);
    }
  };

  const clickOnMentionName = (name: any) => {
    setNewMessage((prev) => {
      return prev + name + " ";
    });
    setSpace(true);
  };

  return (
    <div className="flex max-h-screen flex-col">
      <header className="sticky top-16 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-bold">{group.name}</h1>
              <p className="text-xs text-muted-foreground">
                {group.members.length} members
              </p>
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
                  <div className="flex items-center justify-between">
                    <Label>Share My Location</Label>
                    <Switch
                      checked={shareLocation}
                      onCheckedChange={setShareLocation}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Settings"}
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
            <div className="container">
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
          <BackgroundBeams className="pointer-events-none" />
          <div className="container py-6 px-4">
          <TabsContent value="map" className="mt-0">
            {location ? (
              <MapComponent
                location={location}
                groupLocations={Array.from(groupLocations.entries())}
                members={group?.members}
                source = {group?.source}
                destination = {group?.destination}
              />
            ) : (
              <p>Loading map...</p>
            )}
          </TabsContent>
            <TabsContent value="chat" className="mt-0">
              <div className="flex flex-col h-[70vh]">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.map((message) => {
                    const isYou = message.senderId === user?.id;

                    return (
                      <div
                        key={message._id}
                        className={`flex ${
                          isYou ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex gap-2 max-w-[80%] ${
                            isYou ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage
                              src={
                                group.members.find(
                                  (m: Member) => m.clerkId === message.senderId
                                )?.avatar
                              }
                            />
                            <AvatarFallback>
                              {message.senderName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div
                              className={`rounded-lg px-3 py-2 ${
                                isYou
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p>{message.content}</p>
                            </div>
                            <div
                              className={`flex gap-1 mt-1 text-xs text-muted-foreground ${
                                isYou ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span>{isYou ? "You" : message.senderName}</span>
                              <span>•</span>
                              <span>
                                {new Date(message.timestamp).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="listOMember">
                  {tagging && !space ? (
                    group.members.map((member) => {
                      return (
                        <div
                          className="tagging p-2"
                          onClick={() => {
                            clickOnMentionName(member.name);
                          }}
                        >
                          {member.name}
                        </div>
                      );
                    })
                  ) : (
                    <></>
                  )}
                </div>

                <div className="border-t pt-4 fix-bottom">
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                  >
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => {
                        checkingMessage(e);
                      }}
                    />
                    <Button type="submit">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
              {/* <ChatTab groupId={groupId} members={group?.members}/> */}
            </TabsContent>

            <TabsContent value="members" className="mt-0">
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Group Members</h2>
                <div className="grid gap-4">
                  {group.members.map((member: Member) => (
                    <Card key={member.clerkId}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={member.avatar}
                              alt={member.name}
                            />
                            <AvatarFallback>
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{member.name}</h3>
                              {member.clerkId === user?.id && (
                                <span className="text-xs text-muted-foreground">
                                  (You)
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              {member.isOnline ? (
                                <>
                                  <WifiHighIcon className="h-3 w-3 text-primary" />
                                  <span>Online</span>
                                </>
                              ) : (
                                <>
                                  <WifiOff className="h-3 w-3 text-destructive" />
                                  <span>Offline</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}