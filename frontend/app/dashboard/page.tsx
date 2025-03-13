"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { MapPin, Plus, Users, ArrowRight } from "lucide-react"

export default function Dashboard() {
  const [newGroupName, setNewGroupName] = useState("")
  const [inviteCode, setInviteCode] = useState("")

  // Mock data for groups
  const [groups, setGroups] = useState([
    {
      id: "1",
      name: "Road Trip to California",
      members: 5,
      lastActive: "2 minutes ago",
    },
    {
      id: "2",
      name: "Music Festival",
      members: 8,
      lastActive: "1 hour ago",
    },
  ])

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      const newGroup = {
        id: `${groups.length + 1}`,
        name: newGroupName,
        members: 1,
        lastActive: "Just now",
      }
      setGroups([...groups, newGroup])
      setNewGroupName("")
    }
  }

  const handleJoinGroup = () => {
    // In a real app, this would validate the invite code and join the group
    setInviteCode("")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">GroupTrack</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard/profile">
              <Button variant="ghost" size="sm">
                Profile
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="sm">
                Settings
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              Sign Out
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 container py-6 px-4 md:py-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Your Groups</h1>
            <p className="text-muted-foreground">Create or join groups to track locations and stay connected</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Group Card */}
            <Dialog>
              <DialogTrigger asChild>
                <Card className="border-dashed cursor-pointer hover:border-primary/50 transition-colors">
                  <CardContent className="flex flex-col items-center justify-center h-[200px] gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Plus className="h-8 w-8 text-primary" />
                    </div>
                    <p className="font-medium">Create New Group</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Group</DialogTitle>
                  <DialogDescription>
                    Give your group a name to get started. You can invite others after creation.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="group-name">Group Name</Label>
                    <Input
                      id="group-name"
                      placeholder="e.g., Road Trip 2025"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateGroup}>Create Group</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Join Group Card */}
            <Dialog>
              <DialogTrigger asChild>
                <Card className="border-dashed cursor-pointer hover:border-primary/50 transition-colors">
                  <CardContent className="flex flex-col items-center justify-center h-[200px] gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <p className="font-medium">Join Existing Group</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join a Group</DialogTitle>
                  <DialogDescription>
                    Enter the invite code shared with you to join an existing group.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="invite-code">Invite Code</Label>
                    <Input
                      id="invite-code"
                      placeholder="Enter code (e.g., ABC123)"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleJoinGroup}>Join Group</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Existing Groups */}
            {groups.map((group) => (
              <Link href={`/dashboard/group/${group.id}`} key={group.id}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription>
                      {group.members} members • Active {group.lastActive}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(group.members, 4))].map((_, i) => (
                        <div
                          key={i}
                          className="h-8 w-8 rounded-full bg-primary/10 border border-background flex items-center justify-center text-xs font-medium"
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                      {group.members > 4 && (
                        <div className="h-8 w-8 rounded-full bg-muted border border-background flex items-center justify-center text-xs font-medium">
                          +{group.members - 4}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <span>View Group</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

