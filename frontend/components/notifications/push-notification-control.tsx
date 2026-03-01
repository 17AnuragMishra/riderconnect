"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Bell, BellOff, Rocket, Sparkles, ShieldCheck, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function base64UrlToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationControl() {
  const { user } = useUser();
  const { toast } = useToast();

  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const [unsupportedReason, setUnsupportedReason] = useState<string>("");
  const [origin, setOrigin] = useState<string>("");

  const permissionLabel = useMemo(() => {
    if (permission === "granted") return "Allowed";
    if (permission === "denied") return "Blocked";
    return "Not decided";
  }, [permission]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }

    const support =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      window.isSecureContext;

    setIsSupported(support);
    if (support) {
      setPermission(Notification.permission);
      setUnsupportedReason("");
    } else {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        setUnsupportedReason("Push needs HTTPS (or localhost) in this browser.");
      } else {
        setUnsupportedReason("This browser/device does not fully support Web Push.");
      }
    }
  }, []);

  const fetchVapidKey = async () => {
    if (vapidPublicKey) return vapidPublicKey;

    const res = await fetch(`${API_BASE_URL}/notifications/push/vapid-public-key`);
    if (!res.ok) {
      throw new Error("Push key unavailable on server");
    }

    const data = await res.json();
    const key = (data.publicKey || "").trim();
    if (!key) {
      throw new Error("Server returned empty VAPID key");
    }
    setVapidPublicKey(key);
    return key;
  };

  const registerServiceWorker = async () => {
    return navigator.serviceWorker.register("/sw.js", { scope: "/" });
  };

  const syncSubscriptionWithServer = async (
    subscription: PushSubscription,
    mode: "subscribe" | "unsubscribe"
  ) => {
    if (!user?.id) return;

    const endpoint = `${API_BASE_URL}/notifications/push/${mode}`;
    const body =
      mode === "subscribe"
        ? {
            clerkId: user.id,
            subscription,
          }
        : {
            clerkId: user.id,
            endpoint: subscription.endpoint,
          };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new Error(errorBody || `${mode} failed`);
    }
  };

  const refreshSubscriptionStatus = async () => {
    if (!isSupported) return;
    const registration = await navigator.serviceWorker.getRegistration("/");
    const existing = await registration?.pushManager.getSubscription();
    setIsSubscribed(Boolean(existing));

    if (existing && permission === "granted" && user?.id) {
      try {
        await syncSubscriptionWithServer(existing, "subscribe");
      } catch {
        // no-op: best effort sync
      }
    }
  };

  useEffect(() => {
    if (!isSupported || !user?.id) return;
    refreshSubscriptionStatus().catch(() => {
      // no-op
    });
  }, [isSupported, user?.id, permission]);

  const enablePush = async () => {
    if (!user?.id) return;

    if (!isSupported) {
      toast({
        title: "Push unavailable",
        description: unsupportedReason || "This browser context does not support web push.",
        variant: "destructive",
      });
      return;
    }

    setIsBusy(true);
    try {
      const askedPermission = await Notification.requestPermission();
      setPermission(askedPermission);

      if (askedPermission !== "granted") {
        toast({
          title: "Permission needed",
          description: "Enable browser notifications to receive ride alerts.",
          variant: "destructive",
        });
        return;
      }

      const key = await fetchVapidKey();
      const applicationServerKey = base64UrlToUint8Array(key);

      if (applicationServerKey.length !== 65) {
        throw new Error("Invalid VAPID public key format from server");
      }

      const registration = await registerServiceWorker();
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
        } catch (subscribeError: any) {
          const existing = await registration.pushManager.getSubscription();
          if (existing) {
            await existing.unsubscribe().catch(() => {
              // ignore stale unsubscribe failures
            });
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey,
            });
          } else {
            throw subscribeError;
          }
        }
      }

      await syncSubscriptionWithServer(subscription, "subscribe");
      setIsSubscribed(true);
      toast({
        title: "Ride alerts activated",
        description: "Web push is active on this device.",
      });
    } catch (error: any) {
      const message = (error?.message || "").toLowerCase();
      const isPushServiceError =
        error?.name === "NotSupportedError" ||
        message.includes("push service error") ||
        message.includes("registration failed") ||
        message.includes("not supported");

      toast({
        title: "Push setup failed",
        description: isPushServiceError
          ? "Push service registration failed. Open app on HTTPS (or localhost), allow notifications, then try again."
          : error?.message || "Could not enable push notifications.",
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const disablePush = async () => {
    if (!isSupported) return;

    setIsBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await syncSubscriptionWithServer(subscription, "unsubscribe");
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast({
        title: "Ride alerts paused",
        description: "Push notifications are turned off on this device.",
      });
    } catch (error: any) {
      toast({
        title: "Disable failed",
        description: error?.message || "Could not disable push notifications.",
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const sendTestPush = async () => {
    if (!user?.id) return;

    setIsBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/push/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user.id }),
      });

      if (!res.ok) throw new Error("Test push failed");

      toast({
        title: "Test sent",
        description: "Check your notification tray now.",
      });
    } catch (error: any) {
      toast({
        title: "Unable to send test",
        description: error?.message || "Please enable push first.",
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[120]">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="h-14 w-14 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/90 to-violet-500 text-white shadow-[0_12px_30px_-10px_rgba(80,70,229,0.7)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          aria-label="Toggle push notification controls"
        >
          {isSubscribed ? <Bell className="h-6 w-6" /> : <BellOff className="h-6 w-6" />}
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-background" />
        </button>

        {isOpen && (
          <div className="absolute bottom-16 right-0 w-[290px] rounded-2xl border bg-background/95 backdrop-blur-md p-4 shadow-2xl">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Rider Alerts Hub
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Push updates to your lock screen & desktop tray
                </p>
              </div>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="rounded-xl border p-3 mb-3 bg-muted/40">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Permission</span>
                <span className="font-medium">{permissionLabel}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-muted-foreground">Device status</span>
                <span className="font-medium flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  {isSubscribed ? "Subscribed" : "Not subscribed"}
                </span>
              </div>
              {!isSupported && unsupportedReason && (
                <p className="text-[11px] text-destructive mt-2">{unsupportedReason}</p>
              )}
              <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground space-y-1">
                <div>Origin: {origin || "-"}</div>
                <div>Secure Context: {typeof window !== "undefined" && window.isSecureContext ? "Yes" : "No"}</div>
                <div>Service Worker: {typeof window !== "undefined" && "serviceWorker" in navigator ? "Yes" : "No"}</div>
                <div>PushManager: {typeof window !== "undefined" && "PushManager" in window ? "Yes" : "No"}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {isSubscribed ? (
                <button
                  type="button"
                  onClick={disablePush}
                  disabled={isBusy}
                  className="rounded-lg px-3 py-2 text-xs font-medium border hover:bg-muted disabled:opacity-60"
                >
                  {isBusy ? "Please wait..." : "Disable"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enablePush}
                  disabled={isBusy}
                  className="rounded-lg px-3 py-2 text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {isBusy ? "Please wait..." : "Enable"}
                </button>
              )}

              <button
                type="button"
                onClick={sendTestPush}
                disabled={isBusy || !isSubscribed}
                className="rounded-lg px-3 py-2 text-xs font-medium border flex items-center justify-center gap-1 hover:bg-muted disabled:opacity-60"
              >
                <Rocket className="h-3.5 w-3.5" />
                Test ping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
