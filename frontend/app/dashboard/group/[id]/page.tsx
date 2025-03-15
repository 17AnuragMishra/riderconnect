"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { MapPin, MessageSquare, Users, Settings, Copy, Send, AlertTriangle, Wifi, WifiOff } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { useGroups } from "@/contexts/group-context"
import { useToast } from "@/hooks/use-toast"
import MapComponent from "@/components/Map"

// Mock chat messages
const INITIAL_MESSAGES = [
  { id: "1", sender: "2", content: "Hey everyone! I'm at the gas station now.", timestamp: "10:30 AM" },
  { id: "2", sender: "3", content: "I'll be there in 5 minutes.", timestamp: "10:32 AM" },
  { id: "4", sender: "1", content: "Great! I'm waiting in the parking lot.", timestamp: "10:33 AM" },
  { id: "5", sender: "5", content: "Just left home, ETA 15 minutes.", timestamp: "10:35 AM" },
  { id: "6", sender: "2", content: "The traffic is pretty bad on the highway.", timestamp: "10:40 AM" },
  {
    id: "7",
    sender: "4",
    content: "I might lose signal in the tunnel, don't worry if I disappear for a bit.",
    timestamp: "10:42 AM",
  },
]

export default function GroupPage() {
  const { user, isLoaded } = useUser()
  const params = useParams()
  const router = useRouter()
  const { getGroup, updateGroupSettings } = useGroups()
  const { toast } = useToast()

  const groupId = params.id as string
  const group = getGroup(groupId)

  const [activeTab, setActiveTab] = useState("map")
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [newMessage, setNewMessage] = useState("")
  const [distanceThreshold, setDistanceThreshold] = useState(group?.distanceThreshold || 500)
  const [autoNotify, setAutoNotify] = useState(true)
  const [shareLocation, setShareLocation] = useState(true)
  const [notifications, setNotifications] = useState([
    { id: "1", type: "distance", member: "James Smith", timestamp: "10:45 AM" },
    { id: "2", type: "offline", member: "James Smith", timestamp: "10:46 AM" },
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  const mapRef = useRef(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      redirect("/sign-in")
    }
  }, [isLoaded, user])

  // Redirect if group not found
  useEffect(() => {
    if (isLoaded && !group) {
      toast({
        title: "Error",
        description: "Group not found",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [isLoaded, group, router, toast])

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, activeTab])

  // In a real app, this would initialize the map with Mapbox or Google Maps
  useEffect(() => {
    if (mapRef.current && activeTab === "map") {
      // Initialize map here
      console.log("Map initialized")
    }
  }, [activeTab])

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: `${messages.length + 1}`,
        sender: "1", // Current user
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages([...messages, newMsg])
      setNewMessage("")
    }
  }

  const handleSaveSettings = async () => {
    if (!group) return

    setIsSaving(true)
    try {
      await updateGroupSettings(groupId, {
        distanceThreshold,
      })
      toast({
        title: "Success",
        description: "Group settings updated successfully!",
      })
      setSettingsDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update group settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description: successMessage,
        })
      },
      () => {
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        })
      },
    )
  }

  const getMemberById = (id: string) => {
    return group?.members.find((member) => member.id === id)
  }

  if (!isLoaded || !group) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-16 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-bold">{group.name}</h1>
              <p className="text-xs text-muted-foreground">{group.members.length} members</p>
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
                    Share this code or link with people you want to invite to your group.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Invite Code</Label>
                    <div className="flex items-center gap-2">
                      <Input value={group.inviteCode} readOnly />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(group.inviteCode, "Invite code copied to clipboard!")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Invite Link</Label>
                    <div className="flex items-center gap-2">
                      <Input value={`https://grouptrack.app/join/${group.inviteCode}`} readOnly />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(
                            `https://grouptrack.app/join/${group.inviteCode}`,
                            "Invite link copied to clipboard!",
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setInviteDialogOpen(false)}>Done</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Group Settings</DialogTitle>
                  <DialogDescription>Configure tracking and notification settings for this group.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Distance Threshold ({distanceThreshold} meters)</Label>
                    <Slider
                      value={[distanceThreshold]}
                      min={100}
                      max={2000}
                      step={100}
                      onValueChange={(value) => setDistanceThreshold(value[0])}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get notified when group members are more than {distanceThreshold} meters apart.
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically notify the group about distance and connection issues.
                      </p>
                    </div>
                    <Switch checked={autoNotify} onCheckedChange={setAutoNotify} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Share My Location</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow others in the group to see your real-time location.
                      </p>
                    </div>
                    <Switch checked={shareLocation} onCheckedChange={setShareLocation} />
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

      <main className="flex-1">
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
                <TabsTrigger value="members" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Members</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="container py-6 px-4">
            <TabsContent value="map" className="mt-0">
              <div className="flex flex-col gap-4">
                <MapComponent />
                {/* Notifications */}
                {notifications.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Recent Alerts</h3>
                    <div className="space-y-2">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                            notification.type === "distance"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                          }`}
                        >
                          {notification.type === "distance" ? (
                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <WifiOff className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span>
                            <strong>{notification.member}</strong>{" "}
                            {notification.type === "distance" ? "is too far from the group" : "lost connection"}
                          </span>
                          <span className="ml-auto text-xs opacity-70">{notification.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="chat" className="mt-0">
              <div className="flex flex-col h-[70vh]">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.map((message) => {
                    const sender = getMemberById(message.sender)
                    const isYou = sender?.isYou

                    return (
                      <div key={message.id} className={`flex ${isYou ? "justify-end" : "justify-start"}`}>
                        <div className={`flex gap-2 max-w-[80%] ${isYou ? "flex-row-reverse" : "flex-row"}`}>
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={sender?.avatar} alt={sender?.name} />
                            <AvatarFallback>{sender?.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div
                              className={`rounded-lg px-3 py-2 ${
                                isYou ? "bg-primary text-primary-foreground" : "bg-muted"
                              }`}
                            >
                              <p>{message.content}</p>
                            </div>
                            <div
                              className={`flex gap-1 mt-1 text-xs text-muted-foreground ${
                                isYou ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span>{isYou ? "You" : sender?.name}</span>
                              <span>•</span>
                              <span>{message.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t pt-4">
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSendMessage()
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
            </TabsContent>

            <TabsContent value="members" className="mt-0">
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Group Members</h2>
                <div className="grid gap-4">
                  {group.members.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{member.name}</h3>
                              {member.isYou && <Badge variant="outline">You</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              {member.isOnline ? (
                                <>
                                  <Wifi className="h-3 w-3 text-primary" />
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveTab("chat")
                              // In a real app, this would open a direct message with the member
                              toast({
                                title: "Chat opened",
                                description: `Opening chat with ${member.name}`,
                              })
                            }}
                          >
                            Message
                          </Button>
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
  )
}

