"use client";

import styled from 'styled-components';
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Users, ArrowRight, Trash2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useGroups } from "@/contexts/group-context";
import { useToast } from "@/hooks/use-toast";
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
} from "@/components/ui/alert-dialog";
import axios from "axios";
import { log } from "console";
import { errorMonitor } from "events";

interface Member {
  clerkId: string;
  name: string;
  avatar?: string;
  isOnline?: Boolean;
}

interface Group {
  _id: string;
  name: string;
  code: string;
  source: string;
  destination: string;
  members: Member[];
  createdBy: string;
}

export default function Dashboard() {
  // abhi hardcode kri isko env file mein shift krna h
  const LOCATION_IO_API_KEY = "pk.c08d4617cedabff7deb664bf446142d6";

  const { user, isLoaded } = useUser();
  const { groups, createGroup, joinGroup, deleteGroup } = useGroups();
  const { toast } = useToast();

  const [newGroupName, setNewGroupName] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [suggestedSource, setSuggestedSource] = useState([]);
  const [suggestedDestination, setSuggestedDestination] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) redirect("/sign-in");
    console.log("Current groups in dashboard:", groups); 
  }, [isLoaded, user, groups]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !source.trim() || !destination.trim()) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const group = await createGroup(newGroupName, source, destination);
      toast({
        title: "Success",
        description: `Group "${group.name}" created with code ${group.code}!`,
      });
      setNewGroupName("");
      setSource("");
      setDestination("");
      setCreateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite code",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      const group = await joinGroup(inviteCode);
      if (group) {
        toast({ title: "Success", description: `Joined "${group.name}"!` });
        setInviteCode("");
        setJoinDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Invalid code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join group",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (!isLoaded)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );

  const fetchSuggestion = async (place: string, sourceType: string) => {
    if (place.length < 2) {
      return;
    }
    try {
      const url = `https://api.locationiq.com/v1/autocomplete?key=${LOCATION_IO_API_KEY}&q=${place}`;
      const response = await axios.get(url);
      if (sourceType === "source") {
        setSuggestedSource(response.data);
      } else {
        setSuggestedDestination(response.data);
      }
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  const handleDeleteGroup = async (id: string, name: string) => {
    console.log("Attempting to delete group with ID:", id); 
    try {
      await deleteGroup(id);
      toast({ title: "Success", description: `Group "${name}" deleted!` });
    } catch (error: any) {
      console.error("Delete error:", error); 
      toast({
        title: "Error",
        description: error.message || "Failed to delete group",
        variant: "destructive",
      });
    }
  };

  if (!isLoaded) return <div className="flex max-h-screen items-center justify-center">Loading...</div>;
  return (
    <div className="flex-1 container py-6 px-4 md:py-12">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">
            Welcome, {user?.firstName || "User"}
          </h1>
          <p className="text-muted-foreground">
            Create or join group rides to track and chat
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Card className="border-dashed cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="flex flex-col items-center justify-center h-[200px] gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Plus className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-medium">Create New Group Ride</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Group Ride</DialogTitle>
                <DialogDescription>
                  Set up your ride and invite others.
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
                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    placeholder="e.g., New York"
                    value={source}
                    onChange={(e) => {
                      setSource(e.target.value);
                      fetchSuggestion(e.target.value, e.target.id);
                    }}
                  />
                  {suggestedSource.length > 0 && source.length > 0 && (
                    <SuggestionList>
                      {suggestedSource.map((place, index) => (
                        <div
                          className='list p-1'
                          key={index}
                          onClick={() => {
                            setSource(place.display_name);
                            setSuggestedSource([]);
                          }}
                        >
                          {place.display_name}
                        </div>
                      ))}
                    </SuggestionList>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="e.g., Boston"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      fetchSuggestion(e.target.value, e.target.id);
                    }}
                  />
                  {suggestedDestination.length > 0 && destination.length > 0 && (
                    <SuggestionList>
                      {suggestedDestination.map((place, index) => (
                        <div 
                          className='list p-1'
                          key={index}
                          onClick={() => {
                            setDestination(place.display_name);
                            setSuggestedDestination([]);
                          }}
                        >
                          {place.display_name}
                        </div>
                      ))}
                    </SuggestionList>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateGroup} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Group"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
                <DialogTitle>Join a Group Ride</DialogTitle>
                <DialogDescription>
                  Enter the invite code to join.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <Input
                    id="invite-code"
                    placeholder="e.g., ABC123"
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
          {groups.map((group: Group) => (
            <Card key={group._id} className="hover:shadow-md transition-shadow">
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
                          Are you sure? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            handleDeleteGroup(group._id, group.name)
                          }
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <CardDescription>
                  {group.source} → {group.destination}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex -space-x-2">
                  {group.members
                    .slice(0, 4)
                    .map((member: Member, i: number) => (
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
                <Link href={`/dashboard/group/${group._id}`} className="w-full">
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
  );
}


const SuggestionList = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid black;
  border-right: 1px solid black;
  border-left: 1px solid black;
  height: 25vh;
  overflow-y: scroll;
  .list:hover{
    background-color: #dedede;
    color: black;
  }

  .list{
    border-bottom: 1px solid black;
  }

`;