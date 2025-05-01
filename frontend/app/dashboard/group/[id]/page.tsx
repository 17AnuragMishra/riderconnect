"use client";

import "../[id]/chat.css";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Info, MapPin, MessageSquare, Users, Settings, Copy, Link as LinkIcon } from "lucide-react";
import { FaWhatsapp, FaFacebook, FaTwitter, FaLinkedin, FaTelegram } from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
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
  const mounted = useRef(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [distanceThreshold, setDistanceThreshold] = useState(1000);
  const [originalThreshold, setOriginalThreshold] = useState(1000);
  const [shareLocation, setShareLocation] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [qrCodeLoading, setQrCodeLoading] = useState(true);
  const [qrCodeError, setQrCodeError] = useState(false);
  const [shareLoading, setShareLoading] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const resetInviteDialogState = () => {
    setQrCodeError(false);
    setShareLoading(null);
  };
  const initialized = useRef(false);
  const [open, setOpen] = useState(false);
  const toggleTooltip = () => setOpen(!open);
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
    return () => {
      mounted.current = false;
    };
  }, []);

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

  // Effect to handle QR code loading state
  useEffect(() => {
    if (inviteDialogOpen && mounted.current) {
      // Set QR code to load and then hide loading state after a delay
      setQrCodeLoading(true);
      const timer = setTimeout(() => {
        if (mounted.current) {
          setQrCodeLoading(false);
        }
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [inviteDialogOpen]);
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

  const generateShareUrl = (platform: string) => {
    const groupName = group?.name || "our ride";
    const joinUrl = `${window.location.origin}/join/${group?.code}`;

    // Create different formats based on platform
    const shareText = encodeURIComponent(`Join my group "${groupName}" on RiderConnect!`);
    const shareUrl = encodeURIComponent(joinUrl);

    switch (platform) {
      case 'whatsapp':
        return `https://wa.me/?text=${shareText}%0A${shareUrl}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
      case 'telegram':
        return `https://telegram.me/share/url?url=${shareUrl}&text=${shareText}`;
      default:
        return joinUrl;
    }
  };

  const handleShare = (platform: string) => {
    setShareLoading(platform);
    try {
      const shareUrl = generateShareUrl(platform);
      const windowFeatures = 'width=550,height=450,scrollbars=yes,resizable=yes';

      // For all platforms, use a popup
      const opened = window.open(shareUrl, '_blank', windowFeatures);

      if (!opened) {
        throw new Error('Popup was blocked');
      }

      // Clear loading state after a short delay
      setTimeout(() => setShareLoading(null), 500);
    } catch (error) {
      toast({
        title: 'Share Error',
        description: 'Failed to open share dialog. Please try copying the link instead.',
        variant: 'destructive',
      });
      setShareLoading(null);
    }
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

  function cn(...classes: any[]): string {
    return classes.filter(Boolean).join(' ');
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
                <Tooltip open={open} onOpenChange={setOpen}>
                  <TooltipTrigger asChild>
                    <Info
                      onClick={toggleTooltip}
                      className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary transition"
                    />
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
            <Dialog
              open={inviteDialogOpen}
              onOpenChange={(open) => {
                setInviteDialogOpen(open);
                if (open) {
                  // Reset states when opening dialog
                  setQrCodeLoading(true);
                  setQrCodeError(false);
                  // Set a timeout to hide loading after QR code is likely ready
                  setTimeout(() => setQrCodeLoading(false), 800);
                } else {
                  resetInviteDialogState();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="relative group hover:scale-105 active:scale-95 transition-transform"
                >
                  <Users className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Invite</span>
                  <motion.div
                    className="absolute inset-0 rounded-md bg-primary/10"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-[500px] h-auto max-h-[95vh] overflow-y-auto p-3 sm:p-4 md:p-6 gap-2 sm:gap-4">
                <DialogHeader>
                  <DialogTitle>Invite People to {group.name}</DialogTitle>
                  <DialogDescription>
                    Invite others by scanning the QR code or sharing the invite code below via your preferred communication channels.
                  </DialogDescription>
                </DialogHeader>

                {/* <div className="border-b border-muted/30 mb-2 pb-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Share the invite link or code with your friends.
                  </p>
                </div> */}
                <div className="grid gap-2 sm:gap-4 py-2 sm:py-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-center"
                  >
                    <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow-md relative">
                      {qrCodeLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg z-10 backdrop-blur-sm">
                          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                      )}

                      {qrCodeError ? (
                        <div className="h-[150px] w-[150px] flex flex-col items-center justify-center bg-gray-100 rounded-md p-4 text-center">
                          <div className="text-destructive mb-2">QR Code Error</div>
                          <p className="text-xs text-muted-foreground mb-2">Failed to generate QR code</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setQrCodeError(false);
                              setQrCodeLoading(true);
                            }}
                          >
                            Retry
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Use the QRCode component with correct props */}
                          <QRCodeSVG
                            value={`${window.location.origin}/join/${group.code}`}
                            size={120}
                            className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] rounded-md"
                            level="H"
                            includeMargin={false}
                          />
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(
                                `${window.location.origin}/join/${group.code}`,
                                "QR Code link copied!"
                              )}
                              className="text-xs hover:bg-white/20"
                            >
                              Copy Link
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Invite Code Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="space-y-2"
                  >
                    <Label>Invite Code</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={group.code}
                        readOnly
                        className="bg-secondary/30 font-mono text-base sm:text-lg text-center tracking-wider"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(group.code, "Invite code copied!")}
                        className="hover:bg-primary hover:text-primary-foreground transition-all transform hover:scale-110 active:scale-95"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>

                  {/* Social Share Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="space-y-2"
                  >
                    <Label>Share via</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                      {[
                        { platform: 'whatsapp', icon: FaWhatsapp, color: '#25D366', label: 'WhatsApp' },
                        { platform: 'facebook', icon: FaFacebook, color: '#1877F2', label: 'Facebook' },
                        { platform: 'twitter', icon: FaTwitter, color: '#1DA1F2', label: 'Twitter' },
                        { platform: 'linkedin', icon: FaLinkedin, color: '#0A66C2', label: 'LinkedIn' },
                        { platform: 'telegram', icon: FaTelegram, color: '#0088cc', label: 'Telegram' }
                      ].map(({ platform, icon: Icon, color, label }) => (
                        <Button
                          key={platform}
                          variant="outline"
                          size="icon"
                          disabled={shareLoading !== null}
                          style={{
                            backgroundColor: shareLoading === platform ? 'transparent' : undefined
                          }}
                          className={cn(
                            "transition-all duration-300 relative group",
                            "hover:scale-105 active:scale-95",
                            "hover:text-white focus:text-white focus:ring-2 focus:ring-offset-1",
                            "overflow-hidden",
                            {
                              "cursor-wait opacity-70": shareLoading === platform,
                              "hover:bg-[#25D366] hover:border-[#25D366]": platform === 'whatsapp',
                              "hover:bg-[#1877F2] hover:border-[#1877F2]": platform === 'facebook',
                              "hover:bg-[#1DA1F2] hover:border-[#1DA1F2]": platform === 'twitter',
                              "hover:bg-[#0A66C2] hover:border-[#0A66C2]": platform === 'linkedin',
                              "hover:bg-[#0088cc] hover:border-[#0088cc]": platform === 'telegram'
                            }
                          )}
                          onClick={() => handleShare(platform)}
                          title={`Share on ${label}`}
                        >
                          <div className="relative w-5 h-5 flex items-center justify-center">
                            {shareLoading === platform ? (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                              </div>
                            ) : (
                              <>
                                <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 relative z-10" />
                                <div
                                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-full bg-white"
                                  aria-hidden="true"
                                />
                              </>
                            )}
                          </div>
                          <span className="sr-only">Share on {label}</span>
                        </Button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Share Link Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="space-y-2"
                  >
                    <Label>Share Link</Label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={`${window.location.origin}/join/${group.code}`}
                          readOnly
                          className="bg-secondary/30 font-mono text-[11px] sm:text-sm pr-16 sm:pr-24 truncate"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            `${window.location.origin}/join/${group.code}`,
                            "Share link copied!"
                          )}
                          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 h-7 text-xs sm:text-sm hover:bg-secondary/50"
                        >
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => setInviteDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
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
      <main className="flex-1 overflow-hidden relative z-10">
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
          <BackgroundBeams className="fixed inset-0 pointer-events-none z-0" />
          <div className="container py-6 px-4 relative z-10">
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