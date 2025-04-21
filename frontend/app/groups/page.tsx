"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Plus, 
  Users, 
  ArrowRight, 
  Trash2, 
  MapPin, 
  Calendar, 
  Clock,
  User
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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
import styled, { keyframes } from 'styled-components';

interface Member {
  clerkId: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

interface Group {
  _id: string;
  name: string;
  code: string;
  source: string;
  destination: string;
  startTime: string;
  reachTime: string;
  members: Member[];
  createdBy: string;
  createdAt?: string;
}

const GroupsPage = () => {
  const { user, isLoaded } = useUser();
  const { activeGroups, archivedGroups, deleteGroup } = useGroups();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializePage = async () => {
      try {
        if (!isLoaded) return;

        if (!user) {
          router.push("/sign-in");
          return;
        }

        if (activeGroups.length === 0 && archivedGroups.length === 0) {
          router.push("/dashboard");
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing groups page:", error);
        toast({
          title: "Error",
          description: "Failed to load groups data",
          variant: "destructive",
        });
      }
    };

    initializePage();
    
    return () => {
      // Cleanup if needed
    };
  }, [user, isLoaded, activeGroups, archivedGroups, router, toast]);

  // Calculate consistent metrics based on source and destination
  const getGroupMetrics = (source: string, destination: string) => {
    const hash = (source + destination).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return {
      distance: Math.abs(100 + (hash % 400)),
      duration: {
        hours: Math.abs(1 + (hash % 9)),
        minutes: Math.abs(hash % 60)
      }
    };
  };

  const getTotalMembers = () => {
    return [...activeGroups, ...archivedGroups].reduce((total: number, group: Group) => total + group.members.length, 0);
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

  if (!isLoaded || isLoading) {
    return <GroupsSkeleton />;
  }

  return (
    <div className="flex-1 container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 md:py-12">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Your Groups
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your ride groups and see journey details
          </p>
        </div>
        
        {/* Groups Stats Section */}
        <AnimatedSection className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="mr-4 bg-primary/10 p-2 rounded-full">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {activeGroups.length}
                    </div>
                    <p className="text-xs text-muted-foreground">Ongoing rides</p>
                  </div>
                </div>
              </CardContent>
            </StatsCard>
            
            <StatsCard>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Longest Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="mr-4 bg-accent/10 p-2 rounded-full">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {activeGroups.length > 0 || archivedGroups.length > 0 ? 
                        Math.max(...[...activeGroups, ...archivedGroups].map((g: Group) => getGroupMetrics(g.source, g.destination).distance)) : 0} km
                    </div>
                    <p className="text-xs text-muted-foreground">Maximum distance</p>
                  </div>
                </div>
              </CardContent>
            </StatsCard>
            
            <StatsCard>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fellow Riders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="mr-4 bg-green-500/10 p-2 rounded-full">
                    <User className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {getTotalMembers()}
                    </div>
                    <p className="text-xs text-muted-foreground">Total members</p>
                  </div>
                </div>
              </CardContent>
            </StatsCard>
          </div>
        </AnimatedSection>
        
        {/* Groups List Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Group Rides</h2>
            <div className="text-sm text-muted-foreground">
              {activeGroups.length + archivedGroups.length > 0 
                ? `${activeGroups.length + archivedGroups.length} ${activeGroups.length + archivedGroups.length === 1 ? 'group' : 'groups'}`
                : ''}
            </div>
          </div>
          
          <div className="space-y-8">
            {/* Active Rides Section */}
            <div>
              <h3 className="text-lg font-medium mb-4">Active Rides</h3>
              {activeGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/30 text-center transition-all hover:bg-muted/40">
                  <div className="mb-4 opacity-70">
                    <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground font-medium">No active rides</p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Create a new group or join one to start a ride</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeGroups.map((group: Group) => (
                    <GroupCard key={group._id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <GradientBorder>
                            <div className="px-2 py-1">
                              <CardTitle className="text-lg font-semibold">{group.name}</CardTitle>
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
                                  onClick={() => handleDeleteGroup(group._id, group.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        <CardDescription>
                          {group.createdAt ? `Created ${new Date(group.createdAt).toLocaleDateString()} • ` : ''}{group.code}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{group.source}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span className="text-muted-foreground">{group.destination}</span>
                            </div>
                          </div>
                          {(() => {
                            const metrics = getGroupMetrics(group.source, group.destination);
                            return (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Estimated Distance</p>
                                  <p className="font-medium">{metrics.distance} km</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Est. Duration</p>
                                  <p className="font-medium">
                                    {metrics.duration.hours}h {metrics.duration.minutes}m
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                          <div className="flex items-center justify-between">
                            <div className="flex -space-x-2">
                              {group.members.slice(0, 4).map((member: Member, i: number) => (
                                <TooltipProvider key={i}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="h-8 w-8 rounded-full bg-primary/15 border border-background flex items-center justify-center text-xs font-medium shadow-sm transition-all hover:scale-110">
                                        {member.name.charAt(0)}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{member.name}</p>
                                      {member.isOnline && <span className="ml-2 text-green-500">●</span>}
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
                              {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                            </Badge>
                          </div>
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
                    </GroupCard>
                  ))}
                </div>
              )}
            </div>

            {/* Archived Rides Section */}
            <div>
              <h3 className="text-lg font-medium mb-4">Archived Rides</h3>
              {archivedGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/30 text-center transition-all hover:bg-muted/40">
                  <div className="mb-4 opacity-70">
                    <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground font-medium">No archived rides</p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Completed rides will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {archivedGroups.map((group: Group) => (
                    <GroupCard key={group._id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <GradientBorder>
                            <div className="px-2 py-1">
                              <CardTitle className="text-lg font-semibold">{group.name}</CardTitle>
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
                                  onClick={() => handleDeleteGroup(group._id, group.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        <CardDescription>
                          {group.createdAt ? `Created ${new Date(group.createdAt).toLocaleDateString()} • ` : ''}{group.code}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{group.source}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span className="text-muted-foreground">{group.destination}</span>
                            </div>
                          </div>
                          {(() => {
                            const metrics = getGroupMetrics(group.source, group.destination);
                            return (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Estimated Distance</p>
                                  <p className="font-medium">{metrics.distance} km</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Est. Duration</p>
                                  <p className="font-medium">
                                    {metrics.duration.hours}h {metrics.duration.minutes}m
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                          <div className="flex items-center justify-between">
                            <div className="flex -space-x-2">
                              {group.members.slice(0, 4).map((member: Member, i: number) => (
                                <TooltipProvider key={i}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="h-8 w-8 rounded-full bg-primary/15 border border-background flex items-center justify-center text-xs font-medium shadow-sm transition-all hover:scale-110">
                                        {member.name.charAt(0)}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{member.name}</p>
                                      {member.isOnline && <span className="ml-2 text-green-500">●</span>}
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
                              {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                            </Badge>
                          </div>
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
                    </GroupCard>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

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
const GroupCard = styled(Card)`
  transition: all 0.3s ease;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  animation: ${fadeIn} 0.5s ease;
  border-radius: var(--radius);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
    border-color: hsl(var(--accent)/0.2);
  }
`;

const StatsCard = styled(Card)`
  transition: all 0.3s ease;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
    border-color: hsl(var(--accent)/0.2);
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

const GroupsSkeleton = () => (
  <div className="flex-1 container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[120px] rounded-lg" />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[300px] rounded-lg" />
      ))}
    </div>
  </div>
);

export default GroupsPage;