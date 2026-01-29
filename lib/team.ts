// src/lib/team.ts
import type { Team } from "@/types/workspace";
import api from "./api";

export async function fetchTeams(workspaceId: string): Promise<Team[]> {
  const res = await api.get(`/workspace/${workspaceId}/team`);
  return (res.data ?? []).map((team: { id: string; name: string; iconType?: "IMAGE"; iconValue?: string }) => ({
    id: team.id,
    name: team.name,
    iconType: team.iconType,
    iconValue: team.iconValue,
    role: "Member",
    members: 0,
  }));
}

export type TeamMember = {
  userId: string;
  name: string;
  displayName?: string | null;
  nickname?: string | null;
  role: string;
  email?: string | null;
  avatarUrl?: string | null;
  teamAvatarUrl?: string | null;
  customRoleId?: string | null;
  customRoleName?: string | null;
};

export async function fetchTeamMembers(workspaceId: string, teamId: string): Promise<TeamMember[]> {
  const res = await api.get(`/workspace/${workspaceId}/team/${teamId}/members`);
  return res.data ?? [];
}

export type CustomTeamRole = {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
};

export async function fetchCustomTeamRoles(workspaceId: string, teamId: string): Promise<CustomTeamRole[]> {
  const res = await api.get(`/workspace/${workspaceId}/team/${teamId}/roles`);
  return res.data ?? [];
}

export async function createCustomTeamRole(
  workspaceId: string,
  teamId: string,
  payload: { name: string; description?: string; permissions: string[] }
) {
  const res = await api.post(`/workspace/${workspaceId}/team/${teamId}/roles`, payload);
  return res.data;
}

export async function updateCustomTeamRole(
  workspaceId: string,
  teamId: string,
  roleId: string,
  payload: { name?: string; description?: string; permissions?: string[] }
) {
  const res = await api.patch(`/workspace/${workspaceId}/team/${teamId}/roles/${roleId}`, payload);
  return res.data;
}

export async function deleteCustomTeamRole(workspaceId: string, teamId: string, roleId: string) {
  const res = await api.delete(`/workspace/${workspaceId}/team/${teamId}/roles/${roleId}`);
  return res.data;
}

export async function updateTeamMemberCustomRole(
  workspaceId: string,
  teamId: string,
  memberId: string,
  roleId: string | null
) {
  const res = await api.patch(`/workspace/${workspaceId}/team/${teamId}/members/${memberId}/custom-role`, { roleId });
  return res.data;
}

export type CreateTeamPayload = {
  name: string;
  iconType?: "IMAGE";
  iconValue?: string;
};

export async function createTeam(workspaceId: string, payload: CreateTeamPayload) {
  const res = await api.post(`/workspace/${workspaceId}/team`, payload);
  return res.data;
}

export async function updateTeam(
  workspaceId: string,
  teamId: string,
  payload: Partial<CreateTeamPayload>
) {
  const res = await api.patch(`/workspace/${workspaceId}/team/${teamId}`, payload);
  return res.data;
}

export async function deleteTeam(workspaceId: string, teamId: string) {
  const res = await api.delete(`/workspace/${workspaceId}/team/${teamId}`);
  return res.data;
}

export async function inviteTeamMember(
  workspaceId: string,
  teamId: string,
  payload: { email: string; role: string; message?: string }
) {
  const res = await api.post(`/workspace/${workspaceId}/team/${teamId}/invite`, payload);
  return res.data;
}

export type TeamInvite = {
  id: string;
  email: string;
  name?: string;
  role: string;
  invitedByName: string;
  invitedAt: string;
  status: string;
  message?: string;
};

export async function fetchTeamInvites(workspaceId: string, teamId: string): Promise<TeamInvite[]> {
  const res = await api.get(`/workspace/${workspaceId}/team/${teamId}/invites`);
  return res.data ?? [];
}

export async function updateTeamMemberRole(
  workspaceId: string,
  teamId: string,
  memberId: string,
  role: string
) {
  const res = await api.patch(`/workspace/${workspaceId}/team/${teamId}/members/${memberId}/role`, { role });
  return res.data;
}

export async function updateTeamMemberNickname(
  workspaceId: string,
  teamId: string,
  memberId: string,
  nickname?: string | null
) {
  const res = await api.patch(`/workspace/${workspaceId}/team/${teamId}/members/${memberId}/nickname`, {
    nickname,
  });
  return res.data;
}

export async function updateTeamMemberAvatar(
  workspaceId: string,
  teamId: string,
  memberId: string,
  avatarUrl?: string | null
) {
  const res = await api.patch(`/workspace/${workspaceId}/team/${teamId}/members/${memberId}/avatar`, {
    avatarUrl,
  });
  return res.data;
}

export async function removeTeamMember(workspaceId: string, teamId: string, memberId: string) {
  const res = await api.delete(`/workspace/${workspaceId}/team/${teamId}/members/${memberId}`);
  return res.data;
}

export async function acceptTeamInvite(workspaceId: string, inviteId: string) {
  const res = await api.post(`/workspace/${workspaceId}/team/invite/${inviteId}/accept`);
  return res.data;
}

export async function rejectTeamInvite(workspaceId: string, inviteId: string) {
  const res = await api.post(`/workspace/${workspaceId}/team/invite/${inviteId}/reject`);
  return res.data;
}
