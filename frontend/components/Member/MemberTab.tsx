"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Wifi, WifiOff } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

interface Member {
  clerkId: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

interface Group {
  _id: string;
  members: Member[];
}

interface MemberTabProps {
  group: Group;
}

export default function MemberTab({ group }: MemberTabProps) {
  const { user } = useUser();
  const [members, setMembers] = useState<Member[]>(group.members);

  useEffect(() => {
    setMembers(group.members);
  }, [group.members]);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-200px)]">
      <h2 className="text-xl font-bold mb-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2">
        Group Members ({members.length})
      </h2>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {members.map((member) => (
          <Card key={member.clerkId} className="transition-all duration-200 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{member.name}</h3>
                    {member.clerkId === user?.id && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">(You)</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    {member.isOnline ? (
                      <>
                        <Wifi className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="text-green-600">Online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-red-500 flex-shrink-0" />
                        <span className="text-red-600">Offline</span>
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
  );
}
