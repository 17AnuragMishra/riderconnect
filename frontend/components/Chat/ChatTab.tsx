"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MapPin, WifiOff, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface LocationData {
  lat: number;
  lng: number;
  riderName: string;
  reason: string;
}

interface Message {
  _id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  type?: string;
  locationData?: LocationData;
  timestamp: Date;
}

interface ChatTabProps {
  groupId: string;
  members?: { clerkId: string; name: string; avatar?: string }[];
  onViewLocation?: (lat: number, lng: number) => void;
}

const socket: Socket = io(API_BASE_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// ─── Location Banner Component ────────────────────────────────────────────────

function LocationBanner({
  message,
  onViewLocation,
}: {
  message: Message;
  onViewLocation?: (lat: number, lng: number) => void;
}) {
  const { locationData } = message;
  if (!locationData) return null;

  const isOffline = locationData.reason === "offline";
  const Icon = isOffline ? WifiOff : AlertTriangle;
  const accentColor = isOffline ? "#ef4444" : "#f59e0b";
  const bgGradient = isOffline
    ? "linear-gradient(135deg, #1a0505 0%, #2d0a0a 50%, #1a0505 100%)"
    : "linear-gradient(135deg, #1a1000 0%, #2d1f00 50%, #1a1000 100%)";
  const borderColor = isOffline ? "rgba(239,68,68,0.35)" : "rgba(245,158,11,0.35)";
  const badgeText = isOffline ? "OFFLINE" : "THRESHOLD EXCEEDED";

  return (
    <div
      style={{
        background: bgGradient,
        border: `1px solid ${borderColor}`,
        borderRadius: "14px",
        overflow: "hidden",
        width: "100%",
        maxWidth: "320px",
        boxShadow: `0 4px 20px ${isOffline ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)"}`,
      }}
    >
      {/* Header stripe */}
      <div
        style={{
          background: `linear-gradient(90deg, ${accentColor}22, ${accentColor}44, ${accentColor}22)`,
          borderBottom: `1px solid ${borderColor}`,
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Icon size={13} style={{ color: accentColor, flexShrink: 0 }} />
          <span
            style={{
              fontSize: "10px",
              fontFamily: "monospace",
              letterSpacing: "0.12em",
              color: accentColor,
              fontWeight: 700,
            }}
          >
            {badgeText}
          </span>
        </div>
        <MapPin size={13} style={{ color: accentColor, opacity: 0.7 }} />
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px" }}>
        {/* Rider name */}
        <p
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#f3f4f6",
            marginBottom: "3px",
            lineHeight: 1.2,
          }}
        >
          {locationData.riderName}
        </p>

        {/* Reason subtitle */}
        <p
          style={{
            fontSize: "12px",
            color: "#9ca3af",
            marginBottom: "10px",
          }}
        >
          Last seen location captured
        </p>

        {/* Coordinates pill */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "6px",
            padding: "6px 10px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <MapPin size={12} style={{ color: accentColor, flexShrink: 0 }} />
          <span
            style={{
              fontSize: "11px",
              fontFamily: "monospace",
              color: "#d1d5db",
              letterSpacing: "0.04em",
            }}
          >
            {locationData.lat.toFixed(5)}, {locationData.lng.toFixed(5)}
          </span>
        </div>

        {/* View on Map button */}
        <button
          onClick={() => onViewLocation?.(locationData.lat, locationData.lng)}
          style={{
            width: "100%",
            padding: "9px",
            background: accentColor,
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <MapPin size={14} />
          View on Map
        </button>
      </div>

      {/* Timestamp footer */}
      <div
        style={{
          padding: "6px 14px",
          borderTop: `1px solid ${borderColor}`,
          textAlign: "right",
        }}
      >
        <span style={{ fontSize: "10px", color: "#6b7280", fontFamily: "monospace" }}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

// ─── Main ChatTab Component ───────────────────────────────────────────────────

function ChatTab({ groupId, members, onViewLocation }: ChatTabProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [tagging, setTagging] = useState(false);
  const [space, setSpace] = useState(true);

  const fetchMessages = async (groupId: string): Promise<Message[]> => {
    const res = await axios.get(`${API_BASE_URL}/groups/messages/group/${groupId}`);
    setMessages(res.data.data);
    return res.data.data;
  };

  const { data: initialMessages } = useQuery({
    queryKey: ["messages", groupId],
    queryFn: () => fetchMessages(groupId),
    enabled: !!groupId,
  });

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!user || !groupId || initialized.current) return;

    socket.connect();

    const handleConnect = () => {
      socket.emit("join", { clerkId: user.id, groupId });
    };

    const handleReconnect = () => {
      socket.emit("join", { clerkId: user.id, groupId });
    };

    socket.on("connect", handleConnect);
    socket.on("reconnect", handleReconnect);

    if (socket.connected) {
      socket.emit("join", { clerkId: user.id, groupId });
    }

    initialized.current = true;

    socket.on("receiveMessage", (message: Message) => {
      setMessages((prev) => [...prev, message]);

      // Only play notification sound for regular chat messages
      if (message.type !== "location") {
        setTimeout(() => {
          const audio = new Audio("/Discordnotification.mp3");
          audio.play().catch((err) => console.log("Audio play error:", err));
        }, 300);
      }
    });

    socket.on("notification", (notification) => {
      if (notification.type === "offline") {
        setMessages((prev) => [
          ...prev,
          {
            _id: `${Date.now()}`,
            groupId,
            senderId: "system",
            senderName: "System",
            content: notification.message,
            timestamp: new Date(notification.timestamp),
          },
        ]);
      }
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("reconnect", handleReconnect);
      socket.off("receiveMessage");
      socket.off("notification");
      socket.disconnect();
      initialized.current = false;
    };
  }, [user, groupId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const message = {
      groupId,
      clerkId: user.id,
      clerkName: user.firstName || "User",
      content: newMessage,
    };

    socket.emit("sendMessage", message);
    setNewMessage("");
    setTimeout(async () => {
      const latestMessages = await fetchMessages(groupId);
      setMessages(latestMessages);
    }, 200);
  };

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
    setNewMessage((prev) => prev + name + " ");
    setSpace(true);
  };

  return (
    <div className="flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message) => {
          const isLocationMsg = message.type === "location";
          const sender =
            message.senderId === "system"
              ? null
              : members?.find((m) => m.clerkId === message.senderId);
          const isYou = message.senderId === user?.id;

          // Render rich location banner for location system messages
          if (isLocationMsg) {
            return (
              <div key={message._id} className="flex justify-center py-1">
                <LocationBanner message={message} onViewLocation={onViewLocation} />
              </div>
            );
          }

          return (
            <div
              key={message._id}
              className={`flex ${isYou ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex gap-2 max-w-[80%] ${isYou ? "flex-row-reverse" : "flex-row"
                  }`}
              >
                {sender && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={sender.avatar} alt={sender.name} />
                    <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <div
                    className={`rounded-lg px-3 py-2 ${isYou
                        ? "bg-primary text-primary-foreground"
                        : message.senderId === "system"
                          ? "bg-muted text-center"
                          : "bg-muted"
                      }`}
                  >
                    <p>{message.content}</p>
                  </div>
                  <div
                    className={`flex gap-1 mt-1 text-xs text-muted-foreground ${isYou ? "justify-end" : "justify-start"
                      }`}
                  >
                    <span>{isYou ? "You" : message.senderName}</span>
                    <span>•</span>
                    <span>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
          members?.map((member) => (
            <div
              className="tagging p-2"
              onClick={() => clickOnMentionName(member.name)}
              key={member.clerkId}
            >
              {member.name}
            </div>
          ))
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
            onChange={(e) => checkingMessage(e)}
          />
          <Button type="submit">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();
export default function ChatTabWrapper(props: ChatTabProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatTab {...props} />
    </QueryClientProvider>
  );
}
