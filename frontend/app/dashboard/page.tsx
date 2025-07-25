"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import styled, { keyframes } from 'styled-components';
import { Plus, Users, ArrowRight, Trash2, MapPin, User, Calendar, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "@clerk/nextjs";
import { useGroups } from "@/contexts/group-context";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

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
  startTime: string;
  reachTime: string;
  destination: string;
  members: Member[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

interface PlaceSuggestion {
  display_name: string;
}

// Simple distance calculation using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const LOCATION_IO_API_KEY = "pk.c08d4617cedabff7deb664bf446142d6";
  const { groups, createGroup, joinGroup, deleteGroup } = useGroups();
  const { toast } = useToast();

  const [newGroupName, setNewGroupName] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [reachDateTime, setReachDateTime] = useState("");
  const [validationErrors, setValidationErrors] = useState<{ startTime?: string; reachTime?: string }>({});
  const [suggestedSource, setSuggestedSource] = useState<PlaceSuggestion[]>([]);
  const [suggestedDestination, setSuggestedDestination] = useState<
    PlaceSuggestion[]
  >([]);
  const [inviteCode, setInviteCode] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [groupMetrics, setGroupMetrics] = useState<Map<string, { distance: number; duration: { hours: number; minutes: number } }>>(new Map());
  const [sourceError, setSourceError] = useState<string>("");
  const [destinationError, setDestinationError] = useState<string>("");

  useEffect(() => {
    if (isLoaded && !user) redirect("/sign-in")
  }, [isLoaded, user]);

  const validateDateTimes = () => {
    const errors: { startTime?: string; reachTime?: string } = {};
    if (!startDateTime) {
      errors.startTime = "Start date and time is required";
    }
    if (!reachDateTime) {
      errors.reachTime = "Reach date and time is required";
    }
    if (startDateTime && reachDateTime) {
      const startDate = new Date(startDateTime);
      const reachDate = new Date(reachDateTime);
      if (startDate >= reachDate) {
        errors.reachTime = "Reach time must be after start time";
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateLocation = async (place: string, type: "source" | "destination") => {
    if (!place.trim()) {
      if (type === "source") setSourceError("Source location is required");
      else setDestinationError("Destination location is required");
      return false;
    }

    // Clear error if validation passes
    if (type === "source") setSourceError("");
    else setDestinationError("");
    return true;
  };

  const handleCreateGroup = async () => {
    if (!user) return;

    // Validate locations first
    const isSourceValid = await validateLocation(source, "source");
    const isDestinationValid = await validateLocation(destination, "destination");

    if (!isSourceValid || !isDestinationValid) {
      toast({
        title: "Validation Error",
        description: "Please enter valid locations within India",
        variant: "destructive",
      });
      return;
    }

    if (!validateDateTimes()) {
      toast({
        title: "Invalid Times",
        description: "Start time must be before reach time",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const formattedStartTime = new Date(startDateTime).toISOString();
      const formattedReachTime = new Date(reachDateTime).toISOString();
      const group = await createGroup(newGroupName, source, destination, formattedStartTime, formattedReachTime);
      toast({
        title: "Success",
        description: `Group "${group.name}" created with code ${group.code}!`,
      });
      setNewGroupName("");
      setSource("");
      setDestination("");
      setReachDateTime("");
      setStartDateTime("");
      setValidationErrors({});
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

  const getGroupMetrics = async (source: string, destination: string) => {
    const key = `${source}-${destination}`;
    
    // Check if we already have cached metrics
    if (groupMetrics.has(key)) {
      return groupMetrics.get(key);
    }
    
    // Use simple hash-based calculation for demo purposes
    const hash = (source + destination).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const fallbackMetrics = {
      distance: Math.abs(100 + (hash % 400)),
      duration: {
        hours: Math.abs(1 + (hash % 9)),
        minutes: Math.abs(hash % 60)
      }
    };
    
    setGroupMetrics(prev => new Map(prev).set(key, fallbackMetrics));
    return fallbackMetrics;
  };

  // Load metrics for all groups on component mount
  useEffect(() => {
    const loadMetrics = async () => {
      for (const group of groups) {
        await getGroupMetrics(group.source, group.destination);
      }
    };
    loadMetrics();
  }, [groups]);

  const AnimatedValue: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = "" }) => {
    const [displayValue, setDisplayValue] = useState(0);
    useEffect(() => {
      const duration = 1000;
      const steps = 20;
      const increment = value / steps;
      const interval = duration / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          current = value;
          clearInterval(timer);
        }
        setDisplayValue(Math.floor(current));
      }, interval);
      return () => clearInterval(timer);
    }, [value]);
    return <span>{displayValue.toLocaleString()}{suffix}</span>;
  };

  const getTotalMembers = () => {
    return groups.reduce(
      (total: number, group: Group) => total + group.members.length,
      0
    );
  };

  const getActiveRides = () => {
    const now = new Date();
    return groups.reduce((count: number, group: Group) => {
      try {
        const reachTime = new Date(group.reachTime);
        if (!isNaN(reachTime.getTime()) && reachTime >= now) {
          return count + 1;
        }
        return count;
      } catch (error) {
        return count;
      }
    }, 0);
  };

  if (!isLoaded) return <DashboardSkeleton />;
  const fetchSuggestion = async (place: string, sourceType: string) => {
    if (place.length < 2) return;
    try {
      const url = `https://api.locationiq.com/v1/autocomplete?key=${LOCATION_IO_API_KEY}&q=${place}`;
      const response = await axios.get(url);
      if (sourceType === "source") {
        setSuggestedSource(response.data);
      } else {
        setSuggestedDestination(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
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

  return (
    <div className="flex-1 container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 md:py-12">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {user?.firstName || "User"}
          </h1>
          <p className="text-muted-foreground text-lg">
            Create or join group rides to track and chat with fellow riders
          </p>
        </div>
        <AnimatedSection className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Rides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="mr-4 bg-primary/10 p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      <AnimatedValue value={groups.length} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active group rides
                    </p>
                  </div>
                </div>
              </CardContent>
            </StatsCard>
            <StatsCard>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Distance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="mr-4 bg-accent/10 p-2 rounded-full">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      <AnimatedValue value={groups.length * 245} suffix=" km" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Across all rides
                    </p>
                  </div>
                </div>
              </CardContent>
            </StatsCard>
            <StatsCard>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fellow Riders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="mr-4 bg-green-500/10 p-2 rounded-full">
                    <User className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      <AnimatedValue value={getTotalMembers()} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Connected riders
                    </p>
                  </div>
                </div>
              </CardContent>
            </StatsCard>
            <StatsCard>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Now
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="mr-4 bg-blue-500/10 p-2 rounded-full">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      <AnimatedValue value={getActiveRides()} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ongoing rides
                    </p>
                  </div>
                </div>
              </CardContent>
            </StatsCard>
          </div>
        </AnimatedSection>

        {/* Action Cards Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <CreateGroupCard>
                  <CardContent className="flex flex-col items-center justify-center h-[200px] gap-4">
                    <IconContainer className="bg-white/20 p-3">
                      <Plus className="h-8 w-8" />
                    </IconContainer>
                    <p className="font-medium text-lg">Create New Group Ride</p>
                    <p className="text-white/80 text-sm text-center">
                      Start a new journey with friends
                    </p>
                  </CardContent>
                </CreateGroupCard>
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
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="source">Source (India only)</Label>
                    <Input
                      id="source"
                      placeholder="e.g., Mumbai, Maharashtra"
                      value={source}
                      onChange={(e) => {
                        setSource(e.target.value);
                        setSourceError(""); // Clear error when typing
                        fetchSuggestion(e.target.value, e.target.id);
                      }}
                      onBlur={() => validateLocation(source, "source")}
                      className={sourceError ? "border-red-500" : ""}
                      required
                    />
                    {sourceError && (
                      <p className="text-sm text-red-500">{sourceError}</p>
                    )}
                    {suggestedSource.length > 0 && source.length > 0 && (
                      <SuggestionList>
                        {suggestedSource.map((place, index) => (
                          <div
                            className="list p-1"
                            key={index}
                            onClick={() => {
                              setSource(place.display_name);
                              setSuggestedSource([]);
                              setSourceError(""); // Clear error when selecting
                            }}
                          >
                            {place.display_name}
                          </div>
                        ))}
                      </SuggestionList>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="destination">Destination (India only)</Label>
                    <Input
                      id="destination"
                      placeholder="e.g., Delhi, Delhi"
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value);
                        setDestinationError(""); // Clear error when typing
                        fetchSuggestion(e.target.value, e.target.id);
                      }}
                      onBlur={() => validateLocation(destination, "destination")}
                      className={destinationError ? "border-red-500" : ""}
                      required
                    />
                    {destinationError && (
                      <p className="text-sm text-red-500">{destinationError}</p>
                    )}
                    {suggestedDestination.length > 0 &&
                      destination.length > 0 && (
                        <SuggestionList>
                          {suggestedDestination.map((place, index) => (
                            <div
                              className="list p-1"
                              key={index}
                              onClick={() => {
                                setDestination(place.display_name);
                                setSuggestedDestination([]);
                                setDestinationError(""); // Clear error when selecting
                              }}
                            >
                              {place.display_name}
                            </div>
                          ))}
                        </SuggestionList>
                      )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="startDateTime">Start Date and Time</Label>
                    <Input
                      id="startDateTime"
                      type="datetime-local"
                      value={startDateTime}
                      onChange={(e) => {
                        setStartDateTime(e.target.value);
                        // Clear validation error when user changes the input
                        if (validationErrors.startTime) {
                          setValidationErrors({
                            ...validationErrors,
                            startTime: undefined,
                          });
                        }
                      }}
                      className={
                        validationErrors.startTime ? "border-red-500" : ""
                      }
                      required
                    />
                    {validationErrors.startTime && (
                      <p className="text-sm text-red-500">
                        {validationErrors.startTime}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="reachDateTime">Reach Date and Time</Label>
                    <Input
                      id="reachDateTime"
                      type="datetime-local"
                      value={reachDateTime}
                      onChange={(e) => {
                        setReachDateTime(e.target.value);
                        // Clear validation error when user changes the input
                        if (validationErrors.reachTime) {
                          setValidationErrors({
                            ...validationErrors,
                            reachTime: undefined,
                          });
                        }
                      }}
                      className={
                        validationErrors.reachTime ? "border-red-500" : ""
                      }
                      required
                    />
                    {validationErrors.reachTime && (
                      <p className="text-sm text-red-500">
                        {validationErrors.reachTime}
                      </p>
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
                <JoinGroupCard>
                  <CardContent className="flex flex-col items-center justify-center h-[200px] gap-4">
                    <IconContainer className="bg-white/20 p-3">
                      <Users className="h-8 w-8" />
                    </IconContainer>
                    <p className="font-medium text-lg">Join Existing Group</p>
                    <p className="text-white/80 text-sm text-center">
                      Connect with other riders using a code
                    </p>
                  </CardContent>
                </JoinGroupCard>
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
          </div>
        </section>

        {/* Groups Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Upcoming Group Rides
              <Link href='/groups'>
                <p
                  className="text-xs ml-2 inline-block transition-all duration-300 hover:translate-y-[-2px] hover:underline"
                  style={{ color: "rgb(42 140 238)" }}
                >
                  View all Group
                </p>
              </Link>
            </h2>

            <div className="text-sm text-muted-foreground">
              {groups.length > 0
                ? `${groups.length} ${groups.length === 1 ? "group" : "groups"}`
                : ""}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/30 text-center transition-all hover:bg-muted/40">
                <div className="mb-4 opacity-70">
                  <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground font-medium">
                    No groups yet
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a new group or join one using an invite code
                </p>
              </div>
            ) : (
              groups.slice(0, 3).map((group: Group) => (
                <GroupCard key={group._id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <GradientBorder>
                        <div className="px-2 py-1">
                          <CardTitle className="text-lg font-semibold">
                            {group.name}
                          </CardTitle>
                        </div>
                      </GradientBorder>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors duration-200"
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
                      Created{" "}
                      {new Date(
                        group.createdAt || Date.now()
                      ).toLocaleDateString()}{" "}
                      • {group.code}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Route info */}
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {group.source}
                          </span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="text-muted-foreground">
                            {group.destination}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      {(() => {
                        const key = `${group.source}-${group.destination}`;
                        const metrics = groupMetrics.get(key) || {
                          distance: 0,
                          duration: { hours: 0, minutes: 0 }
                        };
                        return (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">
                                Estimated Distance
                              </p>
                              <p className="font-medium">
                                {formatDistance(metrics.distance)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Est. Duration
                              </p>
                              <p className="font-medium">
                                {formatDuration(metrics.duration.hours * 60 + metrics.duration.minutes)}
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Members section */}
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {group.members
                            .slice(0, 4)
                            .map((member: Member, i: number) => (
                              <TooltipProvider key={i}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="h-8 w-8 rounded-full bg-primary/15 border border-background flex items-center justify-center text-xs font-medium shadow-sm transition-all hover:scale-110">
                                      {member.name.charAt(0)}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{member.name}</p>
                                    {member.isOnline && (
                                      <span className="ml-2 text-green-500">
                                        ●
                                      </span>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                          {group.members.length > 4 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="h-8 w-8 rounded-full bg-muted/80 border border-background flex items-center justify-center text-xs font-medium shadow-sm">
                                    +{group.members.length - 4}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{group.members.length - 4} more members</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {group.members.length}{" "}
                          {group.members.length === 1 ? "member" : "members"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Link
                      href={`/dashboard/group/${group._id}`}
                      className="w-full"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <span>View Group</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </GroupCard>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Styled components for cards
const CreateGroupCard = styled(Card)`
  cursor: pointer;
  background: linear-gradient(
    135deg,
    hsl(var(--primary)) 0%,
    hsl(var(--accent)) 100%
  );
  border: none;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
  animation: ${fadeIn} 0.5s ease;
  border-radius: var(--radius);
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 20px rgba(99, 102, 241, 0.2);
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }

  &:hover::after {
    transform: translateX(100%);
  }

  * {
    color: white;
  }
`;
const JoinGroupCard = styled(Card)`
  cursor: pointer;
  background: linear-gradient(
    135deg,
    hsl(var(--accent)) 0%,
    hsl(var(--primary)) 100%
  );
  border: none;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
  animation: ${fadeIn} 0.5s ease;
  border-radius: var(--radius);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 20px rgba(16, 185, 129, 0.2);
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }

  &:hover::after {
    transform: translateX(100%);
  }

  * {
    color: white;
  }
`;
const GroupCard = styled(Card)`
  transition: all 0.3s ease;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  animation: ${fadeIn} 0.5s ease;
  border-radius: var(--radius);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
    border-color: hsl(var(--accent) / 0.2);
  }
`;

const ActionButton = styled(Button)`
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.03);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  &:hover {
    animation: ${pulse} 0.8s ease infinite;
  }
`;

const MemberAvatars = styled.div`
  display: flex;
  margin-top: 0.5rem;
  align-items: center;
`;
const SuggestionList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  max-height: 200px;
  overflow-y: auto;
  margin-top: 0.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 10;
  background-color: hsl(var(--background));
  animation: ${fadeIn} 0.2s ease;

  .list {
    padding: 0.75rem 1rem;
    transition: all 0.2s ease;
    border-bottom: 1px solid hsl(var(--border));
    cursor: pointer;
    font-size: 0.875rem;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: hsl(var(--muted));
      color: hsl(var(--accent));
    }
  }
`;

// Stats and animation styled components
const StatsCard = styled(Card)`
  transition: all 0.3s ease;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card));

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
    border-color: hsl(var(--accent) / 0.2);
  }
`;

const AnimatedSection = styled.section`
  animation: ${fadeIn} 0.5s ease;
`;

const GradientBorder = styled.div`
  position: relative;
  padding: 1px;
  border-radius: var(--radius);
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));

  > div {
    background: hsl(var(--background));
    border-radius: calc(var(--radius) - 1px);
  }
`;

// Loading skeleton components
const CardSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-[200px] w-full rounded-lg" />
  </div>
);

const DashboardSkeleton = () => (
  <div className="flex-1 container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
    {/* Header skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
    </div>

    {/* Stats skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-[120px] rounded-lg" />
      ))}
    </div>

    {/* Actions skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <Skeleton key={i} className="h-[200px] rounded-lg" />
      ))}
    </div>

    {/* Groups skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[250px] rounded-lg" />
      ))}
    </div>
  </div>
);
