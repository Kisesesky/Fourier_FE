// app/(workspace)/workspace/[teamId]/_components/views/team-members/team-members.types.ts

import type { Member, MemberRole, PresenceStatus } from "@/workspace/members/_model/types";

export type TeamCustomRole = {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
};

export type TeamPendingInvite = {
  id: string;
  email: string;
  role: MemberRole;
  invitedByName: string;
  invitedAt: number;
  status: string;
  name?: string;
  message?: string;
};

export type TeamPresenceMap = Record<string, { status: PresenceStatus }>;

export type TeamMembersTab = "Members" | "Pending Invites" | "Roles";

export type TeamMembersTabContentProps = {
  filteredMembers: Member[];
  presenceMap: TeamPresenceMap;
  profileId?: string;
  isAdmin: boolean;
  currentMemberRole?: MemberRole;
  customRoles: TeamCustomRole[];
  onStartNicknameEdit: (member: Member) => void;
  onRoleChange: (memberId: string, roleValue: string) => void;
  onRemoveMember: (memberId: string, name: string) => void;
};
