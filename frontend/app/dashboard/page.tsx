"use client"

import { useState, useEffect } from "react"
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
import { Plus, Users, ArrowRight, Trash2 } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { useGroups } from "@/contexts/group-context"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const { groups, createGroup, joinGroup, deleteGroup } = useGroups()
  const { toast } = useToast()

  const [newGroupName, setNewGroupName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      redirect("/sign-in")
    }
  }, [isLoaded, user])

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const group = await createGroup(newGroupName)
      toast({
        title: "Success",
        description: `Group "${group.name}" created successfully!`,
      })
      setNewGroupName("")
      setCreateDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite code",
        variant: "destructive",
      })
      return
    }

    setIsJoining(true)
    try {
      const group = await joinGroup(inviteCode)
      if (group) {
        toast({
          title: "Success",
          description: `Joined group "${group.name}" successfully!`,
        })
        setInviteCode("")
        setJoinDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: "Invalid invite code. Please check and try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join group. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  const handleDeleteGroup = async (id: string, name: string) => {
    try {
      await deleteGroup(id)
      toast({
        title: "Success",
        description: `Group "${name}" deleted successfully!`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!isLoaded) {
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
    <div className="flex-1 container py-6 px-4 md:py-12">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Welcome, {user?.firstName || "User"}</h1>
          <p className="text-muted-foreground">Create or join groups to track locations and stay connected</p>
        </div>

        {/* Group Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create New Group Card */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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
                <Button onClick={handleCreateGroup} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Group"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Join Group Card */}
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
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
                <DialogDescription>Enter the invite code shared with you to join an existing group.</DialogDescription>
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
                <Button onClick={handleJoinGroup} disabled={isJoining}>
                  {isJoining ? "Joining..." : "Join Group"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          
        </div>

        {/* Existing Groups */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold">Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            
            {groups.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{group.name}</CardTitle>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Group</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this group? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <CardDescription>
                    {group.members.length} members • Active {group.lastActive}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 4).map((member, i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full bg-primary/10 border border-background flex items-center justify-center text-xs font-medium"
                      >
                        {member.name.charAt(0)}
                      </div>
                    ))}
                    {group.members.length > 4 && (
                      <div className="h-8 w-8 rounded-full bg-muted border border-background flex items-center justify-center text-xs font-medium">
                        +{group.members.length - 4}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Link href={`/dashboard/group/${group.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      <span>View Group</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

