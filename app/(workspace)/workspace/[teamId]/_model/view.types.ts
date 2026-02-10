// app/(workspace)/workspace/[teamId]/_model/view.types.ts

import type { MemberRole } from "@/workspace/members/_model/types";

export type FriendsTab = "friends" | "requests" | "manage";

export type FriendPresenceStatus = "online" | "offline";

export type StoredRecentItem = {
  id: string;
  title: string;
  description: string;
  tag: string;
  visitedAt: number;
  iconKey: string;
  path: string;
  iconValue?: string;
};

export type TeamInviteRole = MemberRole;

export type TeamPermissionOption = {
  id: string;
  label: string;
};
