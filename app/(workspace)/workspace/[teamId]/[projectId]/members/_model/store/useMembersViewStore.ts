// app/(workspace)/workspace/[teamId]/[projectId]/members/_model/store/useMembersViewStore.ts

import { create } from "zustand";
import type { SetStateAction } from "react";
import type { Member, PresenceStatus } from "../types";
import type { UserPresenceStatus } from "@/lib/presence";

type ProfilePrefs = { displayName: string; avatarUrl: string; backgroundImageUrl: string };

type MembersViewState = {
  members: Record<string, Member>;
  memberIds: string[];
  presence: Record<string, { memberId: string; status: PresenceStatus; lastSeenAt: number }>;
  selectedMemberId: string | null;
  teamMembers: Array<{ id: string; name: string; email?: string | null }>;
  myPresence: UserPresenceStatus;
  profilePrefs: ProfilePrefs;
  projectName: string;
  query: string;
  inviteOpen: boolean;
  profileOpen: boolean;
  setMembers: (value: SetStateAction<Record<string, Member>>) => void;
  setMemberIds: (value: SetStateAction<string[]>) => void;
  setPresence: (value: SetStateAction<Record<string, { memberId: string; status: PresenceStatus; lastSeenAt: number }>>) => void;
  setSelectedMemberId: (value: SetStateAction<string | null>) => void;
  setTeamMembers: (value: SetStateAction<Array<{ id: string; name: string; email?: string | null }>>) => void;
  setMyPresence: (value: SetStateAction<UserPresenceStatus>) => void;
  setProfilePrefs: (value: SetStateAction<ProfilePrefs>) => void;
  setProjectName: (value: SetStateAction<string>) => void;
  setQuery: (value: SetStateAction<string>) => void;
  setInviteOpen: (value: SetStateAction<boolean>) => void;
  setProfileOpen: (value: SetStateAction<boolean>) => void;
  resetMembersViewState: () => void;
};

const resolve = <T,>(next: SetStateAction<T>, prev: T): T =>
  typeof next === "function" ? (next as (value: T) => T)(prev) : next;

const initialState = {
  members: {},
  memberIds: [],
  presence: {},
  selectedMemberId: null,
  teamMembers: [],
  myPresence: "online" as UserPresenceStatus,
  profilePrefs: { displayName: "", avatarUrl: "", backgroundImageUrl: "" },
  projectName: "",
  query: "",
  inviteOpen: false,
  profileOpen: false,
};

export const useMembersViewStore = create<MembersViewState>((set) => ({
  ...initialState,
  setMembers: (value) => set((state) => ({ members: resolve(value, state.members) })),
  setMemberIds: (value) => set((state) => ({ memberIds: resolve(value, state.memberIds) })),
  setPresence: (value) => set((state) => ({ presence: resolve(value, state.presence) })),
  setSelectedMemberId: (value) => set((state) => ({ selectedMemberId: resolve(value, state.selectedMemberId) })),
  setTeamMembers: (value) => set((state) => ({ teamMembers: resolve(value, state.teamMembers) })),
  setMyPresence: (value) => set((state) => ({ myPresence: resolve(value, state.myPresence) })),
  setProfilePrefs: (value) => set((state) => ({ profilePrefs: resolve(value, state.profilePrefs) })),
  setProjectName: (value) => set((state) => ({ projectName: resolve(value, state.projectName) })),
  setQuery: (value) => set((state) => ({ query: resolve(value, state.query) })),
  setInviteOpen: (value) => set((state) => ({ inviteOpen: resolve(value, state.inviteOpen) })),
  setProfileOpen: (value) => set((state) => ({ profileOpen: resolve(value, state.profileOpen) })),
  resetMembersViewState: () => set(initialState),
}));
