"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  _id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

interface ChatTabProps {
  groupId: string;
  members: { clerkId: string; name: string; avatar: string }[];
}

const socket: Socket = io("http://localhost:5000", { autoConnect: false });

const fetchMessages = async (groupId: string): Promise<Message[]> => {
  const res = await axios.get(`http://localhost:5000/messages/group/${groupId}`);
  return res.data.data;
};

export default function ChatTab({ groupId, members }: ChatTabProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);    
  console.log("fetch se pehle group If:", groupId);
  const { data: initialMessages, isLoading } = useQuery({
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
    socket.emit("join", { clerkId: user.id, groupId });
    initialized.current = true;

    socket.on("receiveMessage", (message: Message) => {
      setMessages((prev) => [...prev, message]);
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
      socket.off("receiveMessage");
      socket.off("notification");
    };
  }, [user, groupId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;
    const message = {
      groupId,
      clerkId: user.id,
      clerkName: user.firstName || "User",
      content: newMessage,
    };
    socket.emit("sendMessage", message);
    setNewMessage("");
  };

  if (isLoading) return <div>Loading chat...</div>;

  return (
    <div className="flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message) => {
          const sender = message.senderId === "system" ? null : members.find((m) => m.clerkId === message.senderId);
          const isYou = message.senderId === user?.id;

          return (
            <div key={message._id} className={`flex ${isYou ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-2 max-w-[80%] ${isYou ? "flex-row-reverse" : "flex-row"}`}>
                {sender && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={sender.avatar} alt={sender.name} />
                    <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      isYou ? "bg-primary text-primary-foreground" : message.senderId === "system" ? "bg-muted text-center" : "bg-muted"
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
                    <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t pt-4">
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
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button type="submit">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}