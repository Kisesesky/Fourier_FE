// store/members.ts
"use client";

import { create } from "zustand";
import { lsGet, lsSet } from "@/lib/persist";
import {
  createMemberMap,
  createPresenceMap,
  defaultInvites,
  defaultMembers,
  defaultPresence,
} from "@/workspace/members/_model/mocks";
import type {
  Member,
  MemberInvite,
  MemberPresence,
  MemberRole,
  PresenceStatus,
} from "@/workspace/members/_model/types";

type InvitePayload = {
  email: string;
  name?: string;
  role?: MemberRole;
  message?: string;
  avatarUrl?: string;
};

type MemberStore = {
  members: Record<string, Member>;
  memberIds: string[];
  invites: MemberInvite[];
  presence: Record<string, MemberPresence>;
  selectedMemberId: string | null;
  sendInvite: (payload: InvitePayload) => string;
  acceptInvite: (inviteId: string) => string | null;
  declineInvite: (inviteId: string) => void;
  removeMember: (memberId: string) => void;
  toggleFavorite: (memberId: string) => void;
  setPresence: (memberId: string, status: PresenceStatus) => void;
  setSelectedMember: (memberId: string | null) => void;
  updateMember: (memberId: string, payload: Partial<Member>) => void;
  clearPresenceStaleness: () => void;
  resetToMock: () => void;
};

const MEMBERS_KEY = "fd.members.map";
const MEMBER_IDS_KEY = "fd.members.ids";
const INVITES_KEY = "fd.members.invites";
const PRESENCE_KEY = "fd.members.presence";
const SELECTED_KEY = "fd.members.selected";
const VERSION_KEY = "fd.members.version";
const MEMBERS_VERSION = 1;

const DEFAULT_OWNER_ID = "mem-you";
const DEFAULT_OWNER_NAME = "You";

const persistMembers = (members: Record<string, Member>, ids: string[]) => {
  lsSet(MEMBERS_KEY, members);
  lsSet(MEMBER_IDS_KEY, ids);
};

const persistInvites = (invites: MemberInvite[]) => {
  lsSet(INVITES_KEY, invites);
};

const persistPresence = (presence: Record<string, MemberPresence>) => {
  lsSet(PRESENCE_KEY, presence);
};

const persistSelected = (selected: string | null) => {
  lsSet(SELECTED_KEY, selected);
};

type HydratedState = {
  members: Record<string, Member>;
  memberIds: string[];
  invites: MemberInvite[];
  presence: Record<string, MemberPresence>;
  selectedMemberId: string | null;
};

function buildDefaultState(): HydratedState {
  const members = createMemberMap(defaultMembers);
  const memberIds = defaultMembers.map((member) => member.id);
  const invites = [...defaultInvites];
  const presence = createPresenceMap(defaultPresence);
  const selectedMemberId = memberIds[0] ?? null;
  persistMembers(members, memberIds);
  persistInvites(invites);
  persistPresence(presence);
  persistSelected(selectedMemberId);
  lsSet(VERSION_KEY, MEMBERS_VERSION);
  return { members, memberIds, invites, presence, selectedMemberId };
}

function loadHydratedState(): HydratedState {
  const savedVersion = lsGet<number>(VERSION_KEY, 0);
  if (savedVersion !== MEMBERS_VERSION) {
    return buildDefaultState();
  }
  const members = lsGet<Record<string, Member>>(MEMBERS_KEY, createMemberMap(defaultMembers));
  const memberIds = lsGet<string[]>(MEMBER_IDS_KEY, defaultMembers.map((member) => member.id));
  const invites = lsGet<MemberInvite[]>(INVITES_KEY, defaultInvites);
  const presence = lsGet<Record<string, MemberPresence>>(PRESENCE_KEY, createPresenceMap(defaultPresence));
  const selectedMemberId = lsGet<string | null>(SELECTED_KEY, memberIds[0] ?? null);
  return { members, memberIds, invites, presence, selectedMemberId };
}

const hydrated = loadHydratedState();
const initialMembers = hydrated.members;
const initialIds = hydrated.memberIds;
const initialInvites = hydrated.invites;
const initialPresence = hydrated.presence;
const initialSelected = hydrated.selectedMemberId;

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export const useMembers = create<MemberStore>((set, get) => ({
  members: initialMembers,
  memberIds: initialIds,
  invites: initialInvites,
  presence: initialPresence,
  selectedMemberId: initialSelected,

  sendInvite: ({ email, name, role = "member", message, avatarUrl }: InvitePayload) => {
    const trimmedEmail = email.trim().toLowerCase();
    const inviteId = generateId("inv");
    const now = Date.now();
    const invite: MemberInvite = {
      id: inviteId,
      email: trimmedEmail,
      name: name?.trim(),
      role,
      invitedBy: DEFAULT_OWNER_ID,
      invitedByName: DEFAULT_OWNER_NAME,
      invitedAt: now,
      status: "pending",
      message,
      avatarUrl,
    };
    set((state) => {
      const invites = [invite, ...state.invites];
      persistInvites(invites);
      return { invites };
    });
    return inviteId;
  },

  acceptInvite: (inviteId) => {
    const invite = get().invites.find((item) => item.id === inviteId);
    if (!invite) return null;
    const now = Date.now();
    const memberId = generateId("mem");
    const member: Member = {
      id: memberId,
      name: invite.name || invite.email.split("@")[0],
      email: invite.email,
      role: invite.role,
      title: "Team Member",
      joinedAt: now,
      lastActiveAt: now,
      description: invite.message,
      avatarUrl: invite.avatarUrl,
    };

    set((state) => {
      const invites = state.invites.filter((item) => item.id !== inviteId);
      const members = { ...state.members, [memberId]: member };
      const memberIds = [memberId, ...state.memberIds];
      const presence: Record<string, MemberPresence> = {
        ...state.presence,
        [memberId]: { memberId, status: "online" as PresenceStatus, lastSeenAt: now },
      };
      persistMembers(members, memberIds);
      persistInvites(invites);
      persistPresence(presence);
      const selectedMemberId = state.selectedMemberId ?? memberId;
      persistSelected(selectedMemberId);
      return { invites, members, memberIds, presence, selectedMemberId };
    });

    return memberId;
  },

  declineInvite: (inviteId) => {
    set((state) => {
      const invites = state.invites.filter((item) => item.id !== inviteId);
      persistInvites(invites);
      return { invites };
    });
  },

  removeMember: (memberId) => {
    set((state) => {
      const { [memberId]: _, ...rest } = state.members;
      const memberIds = state.memberIds.filter((id) => id !== memberId);
      const presence = { ...state.presence };
      delete presence[memberId];
      const selectedMemberId = state.selectedMemberId === memberId ? memberIds[0] ?? null : state.selectedMemberId;
      persistMembers(rest, memberIds);
      persistPresence(presence);
      persistSelected(selectedMemberId ?? null);
      return {
        members: rest,
        memberIds,
        presence,
        selectedMemberId,
      };
    });
  },

  toggleFavorite: (memberId) => {
    set((state) => {
      const target = state.members[memberId];
      if (!target) return state;
      const members = {
        ...state.members,
        [memberId]: { ...target, isFavorite: !target.isFavorite },
      };
      persistMembers(members, state.memberIds);
      return { members };
    });
  },

  setPresence: (memberId, status) => {
    const now = Date.now();
    set((state) => {
      const members = state.members[memberId]
        ? {
            ...state.members,
            [memberId]: { ...state.members[memberId], lastActiveAt: now },
          }
        : state.members;
      const presence: Record<string, MemberPresence> = {
        ...state.presence,
        [memberId]: { memberId, status, lastSeenAt: now },
      };
      persistMembers(members, state.memberIds);
      persistPresence(presence);
      return { members, presence };
    });
  },

  setSelectedMember: (memberId) => {
    set({ selectedMemberId: memberId });
    persistSelected(memberId ?? null);
  },

  updateMember: (memberId, payload) => {
    set((state) => {
      const target = state.members[memberId];
      if (!target) return state;
      const members = {
        ...state.members,
        [memberId]: { ...target, ...payload, lastActiveAt: payload.lastActiveAt ?? target.lastActiveAt },
      };
      persistMembers(members, state.memberIds);
      return { members };
    });
  },

  clearPresenceStaleness: () => {
    const threshold = Date.now() - 1000 * 60 * 30;
    set((state) => {
      const presence = { ...state.presence };
      let dirty = false;
      Object.entries(presence).forEach(([memberId, record]) => {
        if (record.lastSeenAt < threshold && record.status === "online") {
          presence[memberId] = { ...record, status: "away" as PresenceStatus };
          dirty = true;
        }
      });
      if (dirty) {
        persistPresence(presence);
        return { presence };
      }
      return state;
    });
  },

  resetToMock: () => {
    const defaults = buildDefaultState();
    set({
      members: defaults.members,
      memberIds: defaults.memberIds,
      invites: defaults.invites,
      presence: defaults.presence,
      selectedMemberId: defaults.selectedMemberId,
    });
  },
}));
