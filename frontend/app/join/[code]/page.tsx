"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { useGroups } from "@/contexts/group-context"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Users } from "lucide-react"

export default function JoinPage() {
  const { user, isLoaded } = useUser()
  const params = useParams()
  const router = useRouter()
  const { joinGroup } = useGroups()
  const { toast } = useToast()

  const inviteCode = params.code as string
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      redirect("/sign-in")
    }
  }, [isLoaded, user])

  const handleJoinGroup = async () => {
    if (!inviteCode) {
      setError("Invalid invite code")
      return
    }

    setIsJoining(true)
    setError(null)

    try {
      const group = await joinGroup(inviteCode)
      if (group) {
        toast({
          title: "Success",
          description: `Joined group "${group.name}" successfully!`,
        })
        router.push(`/dashboard/group/${group.id}`)
      } else {
        setError("Invalid invite code. Please check and try again.")
        toast({
          title: "Error",
          description: "Invalid invite code. Please check and try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setError("Failed to join group. Please try again.")
      toast({
        title: "Error",
        description: "Failed to join group. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold">GroupTrack</span>
          </div>
          <CardTitle>Join Group</CardTitle>
          <CardDescription>
            You've been invited to join a group with the code: <strong>{inviteCode}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="rounded-full bg-primary/10 p-4">
              <Users className="h-10 w-10 text-primary" />
            </div>
          </div>
          {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mt-2">{error}</div>}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" onClick={handleJoinGroup} disabled={isJoining}>
            {isJoining ? "Joining..." : "Join Group"}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

