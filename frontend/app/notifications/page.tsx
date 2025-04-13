"use client";

import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle, Clock, Users, AlertTriangle, MessageSquare } from "lucide-react";
import { useTheme } from "next-themes";
import clsx from "clsx";

// Define the notification interface with proper typing
interface Notification {
  id: string;
  sender_id: string;
  group_name: string;
  time: string;
  message: string;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  type: "message" | "invitation" | "update" | "reminder";
}

// Skeleton loader for notifications
const NotificationSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="p-4 border rounded-lg animate-pulse bg-card border-border"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted"></div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="h-4 w-32 rounded bg-muted"></div>
                <div className="h-3 w-16 rounded bg-muted"></div>
              </div>
              <div className="h-3 w-full mt-2 rounded bg-muted"></div>
              <div className="h-3 w-3/4 mt-1 rounded bg-muted"></div>
              <div className="mt-3 flex justify-end">
                <div className="h-8 w-28 rounded bg-muted"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Component for individual notification cards
const NotificationCard = ({ 
  notification, 
  markAsRead,
  isUnread
}: { 
  notification: Notification; 
  markAsRead: (id: string) => void; 
  isUnread: boolean;
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  // Format the timestamp as relative time
  const getRelativeTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return timeString;
    }
  };
  
  // Determine priority styling
  const getPriorityStyles = () => {
    switch(notification.priority) {
      case "high":
        return {
          bg: "bg-[hsl(var(--priority-high)/0.15)]",
          border: "border-[hsl(var(--priority-high))]",
          text: "text-[hsl(var(--priority-high))]",
          icon: <AlertTriangle className="w-4 h-4" />
        };
      case "medium":
        return {
          bg: "bg-[hsl(var(--priority-medium)/0.15)]",
          border: "border-[hsl(var(--priority-medium))]",
          text: "text-[hsl(var(--priority-medium))]",
          icon: <Clock className="w-4 h-4" />
        };
      case "low":
        return {
          bg: "bg-[hsl(var(--priority-low)/0.15)]",
          border: "border-[hsl(var(--priority-low))]",
          text: "text-[hsl(var(--priority-low))]",
          icon: <Bell className="w-4 h-4" />
        };
      default:
        return {
          bg: "bg-[hsl(var(--priority-low)/0.15)]",
          border: "border-[hsl(var(--priority-low))]",
          text: "text-[hsl(var(--priority-low))]",
          icon: <Bell className="w-4 h-4" />
        };
    }
  };
  
  // Determine notification type icon and styling
  // Determine notification type icon and styling
  const getTypeStyles = () => {
    switch(notification.type) {
      case "message":
        return {
          bg: "bg-[hsl(var(--type-message)/0.15)]",
          text: "text-[hsl(var(--type-message-foreground))]",
          icon: <MessageSquare className="w-4 h-4" />
        };
      case "invitation":
        return {
          bg: "bg-[hsl(var(--type-invitation)/0.15)]",
          text: "text-[hsl(var(--type-invitation-foreground))]",
          icon: <Users className="w-4 h-4" />
        };
      case "reminder":
        return {
          bg: "bg-[hsl(var(--type-reminder)/0.15)]",
          text: "text-[hsl(var(--type-reminder-foreground))]",
          icon: <Clock className="w-4 h-4" />
        };
      case "update":
        return {
          bg: "bg-[hsl(var(--type-update)/0.15)]",
          text: "text-[hsl(var(--type-update-foreground))]",
          icon: <Bell className="w-4 h-4" />
        };
      default:
        return {
          bg: "bg-[hsl(var(--type-update)/0.15)]",
          text: "text-[hsl(var(--type-update-foreground))]",
          icon: <Bell className="w-4 h-4" />
        };
    }
  };
  const priorityStyles = getPriorityStyles();
  const typeStyles = getTypeStyles();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        "p-4 rounded-lg transition-all duration-200 border shadow-sm hover:shadow-md",
        "bg-card hover:bg-card/90 border-border",
        isUnread && "border-l-4",
        isUnread && priorityStyles.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className={clsx(
          "flex-shrink-0 p-2 rounded-full",
          typeStyles.bg
        )}>
          {typeStyles.icon}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
              <h3 className={clsx(
                "font-medium text-card-foreground"
              )}>
                {notification.group_name}
              </h3>
              {isUnread && (
                <Badge className={clsx(
                  "text-xs",
                  priorityStyles.bg,
                  priorityStyles.text
                )}>
                  {notification.priority}
                </Badge>
              )}
            </div>
            <time className="text-xs text-muted-foreground">
              {getRelativeTime(notification.time)}
            </time>
          </div>
          
          <p className="text-sm text-foreground">
            {notification.message}
          </p>
          
          <div className="flex justify-between items-center mt-3">
            <Badge variant="outline" className={clsx(
              "text-xs",
              typeStyles.text
            )}>
              {typeStyles.icon}
              <span className="ml-1">{notification.type}</span>
            </Badge>
            
            {isUnread && (
              <Button
                size="sm"
                onClick={() => markAsRead(notification.id)}
                className={clsx(
                  "transition-all duration-300 font-medium flex items-center",
                  "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md",
                  "border border-transparent",
                  "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)]"
                )}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark as Read
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Page = () => {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"unread" | "read">("unread");
  const [loading, setLoading] = useState(true);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  // Client-side rendering check
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Sample notification data with new structure
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      sender_id: "user1",
      group_name: "Project Team",
      time: "2025-04-08 10:00 AM",
      message: "Meeting scheduled at 3 PM today.",
      isRead: false,
      priority: "high",
      type: "reminder",
    },
    {
      id: "2",
      sender_id: "user2",
      group_name: "Study Group",
      time: "2025-04-08 09:30 AM",
      message: "Assignment deadline is tomorrow.",
      isRead: false,
      priority: "medium",
      type: "reminder",
    },
    {
      id: "3",
      sender_id: "user3",
      group_name: "Gaming Squad",
      time: "2025-04-08 08:15 AM",
      message: "Game night starts at 9 PM!",
      isRead: false,
      priority: "low",
      type: "update",
    },
    {
      id: "4",
      sender_id: "user4",
      group_name: "Friends",
      time: "2025-04-07 07:00 PM",
      message: "Let's plan a weekend trip.",
      isRead: true,
      priority: "medium",
      type: "message",
    },
    {
      id: "5",
      sender_id: "user5",
      group_name: "HR Dept",
      time: "2025-04-07 06:45 PM",
      message: "Submit your ID proofs.",
      isRead: true,
      priority: "high",
      type: "reminder",
    },
    {
      id: "6",
      sender_id: "user6",
      group_name: "Tech Team",
      time: "2025-04-07 05:20 PM",
      message: "Code review scheduled for tomorrow.",
      isRead: false,
      priority: "medium",
      type: "update",
    },
    {
      id: "7",
      sender_id: "user7",
      group_name: "Club Members",
      time: "2025-04-07 04:10 PM",
      message: "New event coming this Friday.",
      isRead: true,
      priority: "low",
      type: "update",
    },
    {
      id: "8",
      sender_id: "user8",
      group_name: "Hackathon Team",
      time: "2025-04-07 03:00 PM",
      message: "Submit your demo before 6 PM.",
      isRead: false,
      priority: "high",
      type: "reminder",
    },
    {
      id: "9",
      sender_id: "user9",
      group_name: "Mentorship Program",
      time: "2025-04-07 02:30 PM",
      message: "New session is live now.",
      isRead: true,
      priority: "medium",
      type: "update",
    },
    {
      id: "10",
      sender_id: "user10",
      group_name: "Alumni Group",
      time: "2025-04-07 01:45 PM",
      message: "Join the networking meet this weekend.",
      isRead: false,
      priority: "low",
      type: "invitation",
    },
  ]);

  // Mark all notifications as read
  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    toast({ 
      title: "All notifications marked as read",
      description: "Your notification list has been updated"
    });
  };

  // Mark a single notification as read by ID
  const markOneAsRead = (id: string) => {
    const updated = notifications.map((notification) => 
      notification.id === id 
        ? { ...notification, isRead: true } 
        : notification
    );
    setNotifications(updated);
    toast({ 
      title: "Notification marked as read" 
    });
  };

  // Filter notifications by read status
  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  // Handle loading state
  if (!isLoaded) {
    return (
      <div className={clsx(
        "min-h-screen p-6 flex items-center justify-center",
        "bg-background text-foreground"
      )}>
        <div className="text-center">
          <div className="animate-spin mb-4 h-8 w-8 mx-auto border-t-2 border-b-2 rounded-full border-primary"></div>
          <p>Loading your notifications...</p>
        </div>
      </div>
    );
  }

  // Client-side rendering guard
  if (!isMounted) {
    return null;
  }

  // Get current list based on active tab
  const currentList = activeTab === "unread" ? unread : read;

  return (
    <div className={clsx(
      "min-h-screen p-4 md:p-6 transition-colors duration-200",
      "bg-background text-foreground"
    )}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Notifications
          </h1>
          <Button
            onClick={markAllAsRead}
            variant="outline"
            className={clsx(
              "transition-all hover:scale-105",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 hover:shadow-md"
            )}
            disabled={unread.length === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>

        {/* Tabs using the UI Component */}
        <Tabs 
          defaultValue="unread" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "unread" | "read")}
          className="mb-6"
        >
          <TabsList 
            className={clsx(
              "grid w-full grid-cols-2 mb-6",
              "bg-muted"
            )}
          >
            <TabsTrigger 
              value="unread"
              className="data-[state=active]:bg-background"
            >
              Unread ({unread.length})
            </TabsTrigger>
            <TabsTrigger 
              value="read"
              className="data-[state=active]:bg-background"
            >
              Read ({read.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="mt-0">
            {loading ? (
              <NotificationSkeleton />
            ) : (
              <div>
                {unread.length === 0 ? (
                  <div className={clsx(
                    "p-6 text-center rounded-lg border",
                    "bg-card/50 border-border text-muted-foreground"
                  )}>
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>All caught up! No unread notifications.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="space-y-4">
                      {unread.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          markAsRead={markOneAsRead}
                          isUnread={true}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="read" className="mt-0">
            {loading ? (
              <NotificationSkeleton />
            ) : (
              <div>
                {read.length === 0 ? (
                  <div className={clsx(
                    "p-6 text-center rounded-lg border",
                    "bg-card/50 border-border text-muted-foreground"
                  )}>
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No read notifications yet.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="space-y-4">
                      {read.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          markAsRead={markOneAsRead}
                          isUnread={false}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Page;
