"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { generateInviteCode } from "@/lib/utils"

export type Member = {
  id: string
  name: string
  avatar: string
  isOnline: boolean
  isYou: boolean
  lastLocation?: { lat: number; lng: number }
}

export type Group = {
  id: string
  name: string
  members: Member[]
  inviteCode: string
  distanceThreshold: number
  createdAt: string
  lastActive: string
}

type GroupContextType = {
  groups: Group[]
  createGroup: (name: string) => Promise<Group>
  joinGroup: (inviteCode: string) => Promise<Group | null>
  deleteGroup: (id: string) => Promise<boolean>
  getGroup: (id: string) => Group | undefined
  updateGroupSettings: (id: string, settings: Partial<Group>) => Promise<boolean>
}

const GroupContext = createContext<GroupContextType | undefined>(undefined)

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const [groups, setGroups] = useState<Group[]>([
    {
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
      ],
      inviteCode: "TRIP2025",
      distanceThreshold: 500,
      createdAt: new Date().toISOString(),
      lastActive: "2 minutes ago",
    },
    {
      id: "2",
      name: "Music Festival",
      members: [
        {
          id: "1",
          name: "You",
          avatar: "/placeholder.svg?height=40&width=40",
          isOnline: true,
          isYou: true,
        },
        {
          id: "4",
          name: "James Smith",
          avatar: "/placeholder.svg?height=40&width=40",
          isOnline: false,
          isYou: false,
        },
        {
          id: "5",
          name: "Sarah Wilson",
          avatar: "/placeholder.svg?height=40&width=40",
          isOnline: true,
          isYou: false,
        },
      ],
      inviteCode: "FEST2025",
      distanceThreshold: 300,
      createdAt: new Date().toISOString(),
      lastActive: "1 hour ago",
    },
  ])

  // Load groups from localStorage when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedGroups = localStorage.getItem("grouptrack-groups")
      if (savedGroups) {
        try {
          setGroups(JSON.parse(savedGroups))
        } catch (error) {
          console.error("Failed to parse saved groups:", error)
        }
      }
    }
  }, [])

  // Save groups to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("grouptrack-groups", JSON.stringify(groups))
    }
  }, [groups])

  const createGroup = async (name: string): Promise<Group> => {
    // In a real app, this would make an API call to create the group
    const newGroup: Group = {
      id: Date.now().toString(),
      name,
      members: [
        {
          id: "1",
          name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || "You",
          avatar: user?.imageUrl || "/placeholder.svg?height=40&width=40",
          isOnline: true,
          isYou: true,
        },
      ],
      inviteCode: generateInviteCode(),
      distanceThreshold: 500,
      createdAt: new Date().toISOString(),
      lastActive: "Just now",
    }

    setGroups((prevGroups) => [...prevGroups, newGroup])
    return newGroup
  }

  const joinGroup = async (inviteCode: string): Promise<Group | null> => {
    // In a real app, this would make an API call to join the group
    const group = groups.find((g) => g.inviteCode === inviteCode)

    if (!group) {
      return null
    }

    // Check if user is already a member
    if (group.members.some((m) => m.isYou)) {
      return group
    }

    // Add user to the group
    const updatedGroup = {
      ...group,
      members: [
        ...group.members,
        {
          id: Date.now().toString(),
          name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || "You",
          avatar: user?.imageUrl || "/placeholder.svg?height=40&width=40",
          isOnline: true,
          isYou: true,
        },
      ],
      lastActive: "Just now",
    }

    setGroups((prevGroups) => prevGroups.map((g) => (g.id === group.id ? updatedGroup : g)))

    return updatedGroup
  }

  const deleteGroup = async (id: string): Promise<boolean> => {
    // In a real app, this would make an API call to delete the group
    setGroups((prevGroups) => prevGroups.filter((g) => g.id !== id))
    return true
  }

  const getGroup = (id: string): Group | undefined => {
    return groups.find((g) => g.id === id)
  }

  const updateGroupSettings = async (id: string, settings: Partial<Group>): Promise<boolean> => {
    // In a real app, this would make an API call to update the group settings
    setGroups((prevGroups) => prevGroups.map((g) => (g.id === id ? { ...g, ...settings, lastActive: "Just now" } : g)))
    return true
  }

  return (
    <GroupContext.Provider
      value={{
        groups,
        createGroup,
        joinGroup,
        deleteGroup,
        getGroup,
        updateGroupSettings,
      }}
    >
      {children}
    </GroupContext.Provider>
  )
}

export function useGroups() {
  const context = useContext(GroupContext)
  if (context === undefined) {
    throw new Error("useGroups must be used within a GroupProvider")
  }
  return context
}

