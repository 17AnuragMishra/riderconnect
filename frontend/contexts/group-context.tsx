"use client";

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import io, { Socket } from "socket.io-client";

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
  startTime: string;
  reachTime: string;
  destination: string;
  members: Member[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

const GroupContext = createContext<any>(null);

const API_BASE_URL = 'http://192.168.1.51:5000';
const socket: Socket = io(API_BASE_URL, { autoConnect: false });

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [groups, setGroups] = useState<Group[]>([]);

  const fetchGroups = async () => {
    if (!user || !isLoaded) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/groups?clerkId=${user.id}`);
      const filteredGroups = res.data.filter((g: Group) =>
        g.members.some(m => m.clerkId === user.id)
      );
      setGroups(filteredGroups);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    }
  };

  useEffect(() => {
    if (!user || !isLoaded) return;

    console.log("Current clerkId:", user?.id);
    fetchGroups();

    socket.connect();
    socket.on('groupUpdate', (updatedGroup: Group) => {
      if (!user || !updatedGroup.members.some(m => m.clerkId === user.id)) {
        console.log('Ignoring groupUpdate for non-member group:', updatedGroup._id);
        return;
      }
      setGroups((prev) => {
        const updatedGroups = prev.map(g => g._id === updatedGroup._id ? updatedGroup : g);
        if (!updatedGroups.some(g => g._id === updatedGroup._id)) {
          updatedGroups.push(updatedGroup);
        }
        return updatedGroups;
      });
    });

    return () => {
      socket.off('groupUpdate');
      socket.disconnect();
    };
  }, [user, isLoaded]);

  const createGroup = async (name: string, source: string, destination: string, startTime: string, reachTime: string): Promise<Group> => {
    if (!user) throw new Error("User not authenticated");
    try {
      const res = await axios.post(`${API_BASE_URL}/groups/create`, {
        name,
        source,
        destination,
        clerkId: user.id,
        clerkName: user.firstName || "User",
        clerkAvatar: user.imageUrl || "",
        startTime,
        reachTime,
      });
      const newGroup = res.data;
      console.log("Newly created group:", newGroup);
      await fetchGroups();
      return newGroup;
    } catch (err) {
      console.error("Failed to create group:", err);
      throw err;
    }
  };

  const joinGroup = async (code: string): Promise<Group | null> => {
    if (!user) throw new Error("User not authenticated");
    try {
      const res = await axios.post(`${API_BASE_URL}/groups/join`, {
        code,
        clerkId: user.id,
        clerkName: user.firstName || "User",
        clerkAvatar: user.imageUrl || "",
      });
      const joinedGroup = res.data;
      console.log("Joined group:", joinedGroup);
      await fetchGroups();
      return joinedGroup;
    } catch (err) {
      console.error("Failed to join group:", err);
      throw err;
    }
  };

  const deleteGroup = async (id: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    try {
      const res = await axios.delete(`${API_BASE_URL}/groups/${id}?clerkId=${user.id}`);
      await fetchGroups();
    } catch (err: any) {
      if (err.response?.status === 404) {
        throw new Error("group not found or maybe you don't have a permission to do so");
      } else if (err.response?.status === 403) {
        throw new Error("Not authorized to delete this group");
      }
      throw err;
    }
  };

  const getGroup = (id: string): Group | undefined => groups.find((g) => g._id === id);

  const updateGroupSettings = async (id: string, settings: Partial<Group>): Promise<void> => {
    setGroups((prev) => prev.map((g) => (g._id === id ? { ...g, ...settings } : g)));
  };

  return (
    <GroupContext.Provider value={{ groups, createGroup, joinGroup, deleteGroup, getGroup, updateGroupSettings }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroups() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error("context undefine hoke fail ho gya hai bhai");
  }
  return context;
}