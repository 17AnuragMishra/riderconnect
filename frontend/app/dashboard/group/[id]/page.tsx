"use client"

import { useState, useEffect, useRef } from "react"
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
import { MapPin, MessageSquare, Users, Settings, Share2, Copy, Send, AlertTriangle, Wifi, WifiOff } from "lucide-react"

// Mock data for the group
const GROUP_DATA = {
  id: "1",
  name: "Road Trip to California",
  members: [
    {
      id: "1",
      name: "You",
      avatar: "/placeholder.svg?height=40&width=40",
      isOnline: true,
      isYou: true,
      lastLocation: { lat: 34.052235, lng: -118.243683 },
    },
    {
      id: "2",
      name: "Alex Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      isOnline: true,
      isYou: false,
      lastLocation: { lat: 34.053235, lng: -118.245683 },
    },
    {
      id: "3",
      name: "Maria Garcia",
      avatar: "/placeholder.svg?height=40&width=40",
      isOnline: true,
      isYou: false,
      lastLocation: { lat: 34.051235, lng: -118.242683 },
    },
    {
      id: "4",
      name: "James Smith",
      avatar: "/placeholder.svg?height=40&width=40",
      isOnline: false,
      isYou: false,
      lastLocation: { lat: 34.050235, lng: -118.241683 },
    },
    {
      id: "5",
      name: "Sarah Wilson",
      avatar: "/placeholder.svg?height=40&width=40",
      isOnline: true,
      isYou: false,
      lastLocation: { lat: 34.054235, lng: -118.246683 },
    },
  ],
  inviteCode: "TRIP2025",
  distanceThreshold: 500, // in meters
  createdAt: "2025-01-15T10:30:00Z",
}

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

export default function GroupPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("map")
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [newMessage, setNewMessage] = useState("")
  const [distanceThreshold, setDistanceThreshold] = useState(GROUP_DATA.distanceThreshold)
  const [autoNotify, setAutoNotify] = useState(true)
  const [shareLocation, setShareLocation] = useState(true)
  const [notifications, setNotifications] = useState([
    { id: "1", type: "distance", member: "James Smith", timestamp: "10:45 AM" },
    { id: "2", type: "offline", member: "James Smith", timestamp: "10:46 AM" },
  ])

  const mapRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

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

  const getMemberById = (id: string) => {
    return GROUP_DATA.members.find((member) => member.id === id)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-bold">{GROUP_DATA.name}</h1>
              <p className="text-xs text-muted-foreground">{GROUP_DATA.members.length} members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Invite</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite People to {GROUP_DATA.name}</DialogTitle>
                  <DialogDescription>
                    Share this code or link with people you want to invite to your group.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Invite Code</Label>
                    <div className="flex items-center gap-2">
                      <Input value={GROUP_DATA.inviteCode} readOnly />
                      <Button variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Invite Link</Label>
                    <div className="flex items-center gap-2">
                      <Input value={`https://grouptrack.app/join/${GROUP_DATA.inviteCode}`} readOnly />
                      <Button variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Invite
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
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
                  <Button>Save Settings</Button>
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
                <div className="relative w-full h-[60vh] bg-muted rounded-lg overflow-hidden" ref={mapRef}>
                  {/* This would be replaced with an actual map component */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-4">
                      <MapPin className="h-10 w-10 text-primary mx-auto mb-2" />
                      <p className="font-medium">Map would render here with real-time locations</p>
                      <p className="text-sm text-muted-foreground mt-2">Using Mapbox or Google Maps API</p>
                    </div>
                  </div>

                  {/* Sample map markers */}
                  <TooltipProvider>
                    {GROUP_DATA.members.map((member, index) => (
                      <Tooltip key={member.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={`absolute w-10 h-10 rounded-full border-2 ${member.isOnline ? "border-primary" : "border-muted-foreground"} transform -translate-x-1/2 -translate-y-1/2 cursor-pointer`}
                            style={{
                              left: `${20 + index * 15}%`,
                              top: `${30 + index * 10}%`,
                            }}
                          >
                            <Avatar className="h-full w-full">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {!member.isOnline && (
                              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <p className="font-medium">
                              {member.name} {member.isYou && "(You)"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.isOnline ? (
                                <span className="flex items-center gap-1">
                                  <Wifi className="h-3 w-3 text-primary" /> Online
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <WifiOff className="h-3 w-3 text-destructive" /> Offline
                                </span>
                              )}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>

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
                  {GROUP_DATA.members.map((member) => (
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
                          <Button variant="outline" size="sm">
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

