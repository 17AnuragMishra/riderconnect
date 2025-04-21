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
import io from "socket.io-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Define the notification interface with proper typing
interface Notification {
  id: string;
  senderId?: string;
  groupId: string;
  senderName?: string;
  groupName: string;
  time: string;
  message: string;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  type: "message" | "invitation" | "update" | "reminder" | "distance";
}

// Skeleton loader for notifications
const NotificationSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="p-3.5 sm:p-4 border rounded-lg animate-pulse bg-card border-border"
        >
          <div className="flex items-start gap-2.5 sm:gap-3 overflow-hidden">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-muted flex-shrink-0"></div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start w-full">
                <div className="h-4 w-28 sm:w-32 rounded bg-muted max-w-full"></div>
                <div className="h-3 w-16 rounded bg-muted mt-1.5 sm:mt-0 flex-shrink-0"></div>
              </div>
              <div className="h-3 w-full mt-2.5 rounded bg-muted"></div>
              <div className="h-3 w-3/4 mt-1.5 rounded bg-muted"></div>
              <div className="mt-3.5 flex justify-center sm:justify-end">
                <div className="h-9 sm:h-8 w-full sm:w-28 rounded bg-muted"></div>
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
      case "distance":
        return {
          bg: "bg-[hsl(var(--priority-high)/0.15)]",
          text: "text-[hsl(var(--priority-high))]",
          icon: <AlertTriangle className="w-4 h-4" />
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
        "p-3.5 sm:p-4 md:p-5 rounded-lg transition-all duration-200 border shadow-sm hover:shadow-md",
        "bg-card hover:bg-card/90 border-border",
        isUnread && "border-l-4",
        isUnread && priorityStyles.border
      )}
    >
      <div className="flex items-start gap-2.5 sm:gap-3 overflow-hidden">
        <div className={clsx(
          "flex-shrink-0 p-2 sm:p-2.5 rounded-full",
          typeStyles.bg
        )}>
          {typeStyles.icon}
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1.5 sm:mb-1 gap-1 sm:gap-0 w-full">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-[calc(100%-3rem)] sm:max-w-[70%]">
              <h3 className={clsx(
                "font-medium text-card-foreground text-sm sm:text-base line-clamp-1 break-all sm:break-words max-w-full"
              )}>
                {notification.groupName}
              </h3>
              {isUnread && (
                <Badge className={clsx(
                  "text-xs h-5 px-2 py-0.5 whitespace-nowrap flex-shrink-0",
                  priorityStyles.bg,
                  priorityStyles.text
                )}>
                  {notification.priority}
                </Badge>
              )}
            </div>
            <time className="text-xs text-muted-foreground mt-0.5 sm:mt-0 whitespace-nowrap flex-shrink-0">
              {getRelativeTime(notification.time)}
            </time>
          </div>
          
          <p className="text-sm text-foreground line-clamp-3 sm:line-clamp-2 md:line-clamp-none break-words overflow-hidden text-ellipsis max-w-full">
            {notification.message}
          </p>
          
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2.5 sm:gap-2 mt-3 sm:mt-3.5 w-full">
            <Badge variant="outline" className={clsx(
              "text-xs h-7 sm:h-6 inline-flex items-center justify-center px-2 truncate max-w-full sm:max-w-[50%]",
              typeStyles.text
            )}>
              {typeStyles.icon}
              <span className="ml-1 truncate">{notification.type}</span>
            </Badge>
            
            {isUnread && (
              <Button
                size="sm"
                onClick={() => markAsRead(notification.id)}
                className={clsx(
                  "transition-all duration-300 font-medium flex items-center",
                  "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md",
                  "border border-transparent w-full sm:w-auto justify-center",
                  "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)]",
                  "py-2.5 px-4 h-10 sm:h-9 text-sm whitespace-nowrap overflow-hidden"
                )}
              >
                <CheckCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                <span className="truncate">Mark as Read</span>
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
  const { resolvedTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);

  // Client-side rendering check
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!user) return;

    // Initialize Socket.io
    const newSocket = io(API_BASE_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { clerkId: user.id },
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('notification', (notification: Notification) => {
      setNotifications((prev) => {
        if (!prev.some(n => n.id === notification.id)) {
          return [notification, ...prev];
        }
        return prev;
      });
      toast({
        title: `${notification.groupName} - ${notification.type}`,
        description: notification.message,
        variant: notification.priority === 'high' ? 'destructive' : 'default',
      });
    });

    newSocket.on('notificationRead', ({ notificationId, clerkId }) => {
      if (clerkId === user.id) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    });

    newSocket.on('error', ({ message }) => {
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    });

    newSocket.connect();

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications?clerkId=${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data);
        setLoading(false);
      } catch (err) {
        console.error('Fetch notifications error:', err);
        toast({
          title: 'Error',
          description: 'Failed to load notifications',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };
    fetchNotifications();

    return () => {
      newSocket.disconnect();
    };
  }, [user, toast]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user?.id }),
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast({ 
        title: "All notifications marked as read",
        description: "Your notification list has been updated",
      });
    } catch (err) {
      console.error('Mark all as read error:', err);
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive',
      });
    }
  };

  // Mark a single notification as read
  const markOneAsRead = (id: string) => {
    socket?.emit('markNotificationRead', { notificationId: id, clerkId: user?.id });
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
      "min-h-screen p-3.5 sm:p-4 md:p-6 transition-colors duration-200 overflow-x-hidden",
      "bg-background text-foreground"
    )}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 sm:gap-4 mb-5 sm:mb-6 w-full">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate max-w-full">
            Notifications
          </h1>
          <Button
            onClick={markAllAsRead}
            variant="outline"
            className={clsx(
              "transition-all hover:scale-105 w-full sm:w-auto",
              "bg-primary text-primary-foreground py-2.5 px-4 h-11 sm:h-10",
              "hover:bg-primary/90 hover:shadow-md text-sm sm:text-base",
              "font-medium whitespace-nowrap overflow-hidden"
            )}
            disabled={unread.length === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2.5 sm:mr-2 flex-shrink-0" />
            <span className="truncate">Mark all as read</span>
          </Button>
        </div>

        <Tabs 
          defaultValue="unread" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "unread" | "read")}
          className="mb-5 sm:mb-6"
        >
          <TabsList 
            className={clsx(
              "grid w-full grid-cols-2 mb-5 sm:mb-6 h-12 sm:h-11",
              "bg-muted rounded-md"
            )}
          >
            <TabsTrigger 
              value="unread"
              className="text-sm sm:text-base py-2.5 px-3 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center justify-center transition-all duration-200"
            >
              <span>Unread</span>
              <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                {unread.length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="read"
              className="text-sm sm:text-base py-2.5 px-3 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center justify-center transition-all duration-200"
            >
              <span>Read</span>
              <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-muted-foreground/15 text-muted-foreground text-xs font-medium">
                {read.length}
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="unread" className="mt-0">
            {loading ? (
              <NotificationSkeleton />
            ) : (
              <div>
                {unread.length === 0 ? (
                  <div className={clsx(
                    "p-5 sm:p-6 text-center rounded-lg border",
                    "bg-card/50 border-border text-muted-foreground"
                  )}>
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="break-words">All caught up! No unread notifications.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="space-y-4 w-full overflow-hidden">
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
                    "p-5 sm:p-6 text-center rounded-lg border",
                    "bg-card/50 border-border text-muted-foreground"
                  )}>
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="break-words">No read notifications yet.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="space-y-4 w-full overflow-hidden">
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