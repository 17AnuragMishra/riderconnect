'use client'

import { Avatar, AvatarFallback, AvatarProps, AvatarImage } from "@radix-ui/react-avatar"
import { Card,CardContent } from "../ui/card"
import { Wifi, WifiOff } from "lucide-react"
import { useUser } from "@clerk/nextjs";

interface Member {
  clerkId: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

interface MemberTabs {
    group: any;
    members?: { clerkId: string; name: string; avatar?: string }[];
  }

export default function MemberTab({ group, members }: MemberTabs) {
    const { user, isLoaded } = useUser();
    return (
    <div className="space-y-4">
        <h2 className="text-xl font-bold">Group Members</h2>
        <div className="grid gap-4">
          {group.members.map((member: Member) => (
            <Card key={member.clerkId}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{member.name}</h3>
                      {member.clerkId === user?.id && <span className="text-xs text-muted-foreground">(You)</span>}
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
    )
};