"use client";

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

interface Member {
  clerkId: string;
  name: string;
  avatar?: string;
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

const page = () => {
  const { user, isLoaded } = useUser();
  const { groups, deleteGroup } = useGroups();
  const { toast } = useToast();

  const [newGroupName, setNewGroupName] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!user) {
      redirect("/sign-in");
    }
    if (groups.size == 0) {
      redirect("dashboard");
    } else {
      groups;
    }
  }, [user, isLoaded, groups]);

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

  return (
    <div className="flex-1 container py-6 px-4 md:py-12">
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
};

export default page;
