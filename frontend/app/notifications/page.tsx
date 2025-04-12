"use client";

import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

interface Notification {
  sender_id: string;
  group_name: string;
  time: string;
  message: string;
  isRead: boolean;
}

const Page = () => {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"unread" | "read">("unread");

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      sender_id: "user1",
      group_name: "Project Team",
      time: "2025-04-08 10:00 AM",
      message: "Meeting scheduled at 3 PM today.",
      isRead: false,
    },
    {
      sender_id: "user2",
      group_name: "Study Group",
      time: "2025-04-08 09:30 AM",
      message: "Assignment deadline is tomorrow.",
      isRead: false,
    },
    {
      sender_id: "user3",
      group_name: "Gaming Squad",
      time: "2025-04-08 08:15 AM",
      message: "Game night starts at 9 PM!",
      isRead: false,
    },
    {
      sender_id: "user4",
      group_name: "Friends",
      time: "2025-04-07 07:00 PM",
      message: "Let's plan a weekend trip.",
      isRead: true,
    },
    {
      sender_id: "user5",
      group_name: "HR Dept",
      time: "2025-04-07 06:45 PM",
      message: "Submit your ID proofs.",
      isRead: true,
    },
    {
      sender_id: "user6",
      group_name: "Tech Team",
      time: "2025-04-07 05:20 PM",
      message: "Code review scheduled for tomorrow.",
      isRead: false,
    },
    {
      sender_id: "user7",
      group_name: "Club Members",
      time: "2025-04-07 04:10 PM",
      message: "New event coming this Friday.",
      isRead: true,
    },
    {
      sender_id: "user8",
      group_name: "Hackathon Team",
      time: "2025-04-07 03:00 PM",
      message: "Submit your demo before 6 PM.",
      isRead: false,
    },
    {
      sender_id: "user9",
      group_name: "Mentorship Program",
      time: "2025-04-07 02:30 PM",
      message: "New session is live now.",
      isRead: true,
    },
    {
      sender_id: "user10",
      group_name: "Alumni Group",
      time: "2025-04-07 01:45 PM",
      message: "Join the networking meet this weekend.",
      isRead: false,
    },
  ]);

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    toast({ title: "All notifications marked as read." });
  };

  const markOneAsRead = (index: number) => {
    const updated = [...notifications];
    updated[index].isRead = true;
    setNotifications(updated);
  };

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  if (!isLoaded) {
    return <div className="text-white">The notification is getting Loaded, Please Wait...</div>;
  }

  const currentList = activeTab === "unread" ? unread : read;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <Button onClick={markAllAsRead} variant="outline">
          Mark all as Read
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-zinc-700">
        <button
          className={clsx(
            "pb-2 font-semibold transition",
            activeTab === "unread" ? "border-b-2 border-white" : "text-zinc-400"
          )}
          onClick={() => setActiveTab("unread")}
        >
          Unread ({unread.length})
        </button>
        <button
          className={clsx(
            "pb-2 font-semibold transition",
            activeTab === "read" ? "border-b-2 border-white" : "text-zinc-400"
          )}
          onClick={() => setActiveTab("read")}
        >
          Read ({read.length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {currentList.length === 0 ? (
          <p className="text-zinc-500">No notifications here.</p>
        ) : (
          currentList.map((note, i) => {
            const originalIndex = notifications.findIndex((n) => n === note);
            return (
              <div
                key={i}
                className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg shadow"
              >
                <p className="font-semibold">{note.group_name}</p>
                <p className="text-sm text-zinc-300">{note.message}</p>
                <p className="text-xs text-zinc-500 mt-1">{note.time}</p>
                {activeTab === "unread" && (
                  <Button
                    size="sm"
                    className="mt-2"
                    variant="secondary"
                    onClick={() => markOneAsRead(originalIndex)}
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Page;
