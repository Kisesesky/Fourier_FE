// app/(workspace)/workspace/[teamId]/_model/schemas/team-members.schemas.ts
import { z } from "zod";
import type { Member } from "@/workspace/members/_model/types";
import { mapTeamRole } from "../utils/view.utils";
import type { TeamCustomRole, TeamPendingInvite } from "../types/team-members.types";

export const TeamMemberRowSchema = z.object({
  userId: z.string(),
  name: z.string().optional(),
  displayName: z.string().nullable().optional(),
  nickname: z.string().nullable().optional(),
  role: z.string(),
  email: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  teamAvatarUrl: z.string().nullable().optional(),
  customRoleId: z.string().nullable().optional(),
  customRoleName: z.string().nullable().optional(),
}).passthrough();

export const TeamCustomRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  permissions: z.array(z.string()).default([]),
});

export const TeamInviteSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.string(),
  invitedByName: z.string().optional().default(""),
  invitedAt: z.string(),
  status: z.string(),
  name: z.string().optional(),
  message: z.string().optional(),
});

export const parseTeamMemberRows = (input: unknown) => {
  const parsed = z.array(TeamMemberRowSchema).safeParse(input ?? []);
  return parsed.success ? parsed.data : [];
};

export const parseTeamCustomRoles = (input: unknown): TeamCustomRole[] => {
  const parsed = z.array(TeamCustomRoleSchema).safeParse(input ?? []);
  return parsed.success ? parsed.data : [];
};

export const parseTeamInvites = (input: unknown): TeamPendingInvite[] => {
  const parsed = z.array(TeamInviteSchema).safeParse(input ?? []);
  if (!parsed.success) return [];
  return parsed.data.map((invite) => ({
    id: invite.id,
    email: invite.email,
    role: mapTeamRole(invite.role),
    invitedByName: invite.invitedByName,
    invitedAt: new Date(invite.invitedAt).getTime(),
    status: invite.status,
    name: invite.name,
    message: invite.message,
  }));
};

export const mapTeamMembersToViewMembers = (input: unknown): Member[] => {
  const rows = parseTeamMemberRows(input);
  return rows.map((member) => ({
    id: member.userId,
    name: member.nickname ?? member.displayName ?? member.name ?? member.email ?? "User",
    displayName: member.displayName ?? member.name ?? member.email ?? "User",
    username: member.name ?? "",
    nickname: member.nickname ?? null,
    email: member.email ?? "",
    role: mapTeamRole(member.role),
    avatarUrl: member.avatarUrl ?? undefined,
    teamAvatarUrl: member.teamAvatarUrl ?? null,
    customRoleId: member.customRoleId ?? null,
    customRoleName: member.customRoleName ?? null,
    joinedAt: Date.now(),
    lastActiveAt: Date.now(),
  }));
};
