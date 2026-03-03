// app/(workspace)/workspace/[teamId]/_service/team-members.api.ts
import {
  createCustomTeamRole,
  deleteCustomTeamRole,
  fetchCustomTeamRoles,
  fetchTeamInvites,
  fetchTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  updateCustomTeamRole,
  updateTeamMemberAvatar,
  updateTeamMemberCustomRole,
  updateTeamMemberNickname,
  updateTeamMemberRole,
} from "@/lib/team";
import {
  mapTeamMembersToViewMembers,
  parseTeamCustomRoles,
  parseTeamInvites,
} from "../_model/schemas/team-members.schemas";

export async function listTeamMembers(workspaceId: string, teamId: string) {
  const data = await fetchTeamMembers(workspaceId, teamId);
  return mapTeamMembersToViewMembers(data);
}

export async function listTeamCustomRoles(workspaceId: string, teamId: string) {
  const data = await fetchCustomTeamRoles(workspaceId, teamId);
  return parseTeamCustomRoles(data);
}

export async function listTeamPendingInvites(workspaceId: string, teamId: string) {
  const data = await fetchTeamInvites(workspaceId, teamId);
  return parseTeamInvites(data);
}

export async function createTeamCustomRole(
  workspaceId: string,
  teamId: string,
  payload: { name: string; description?: string; permissions: string[] },
) {
  const data = await createCustomTeamRole(workspaceId, teamId, payload);
  return parseTeamCustomRoles([data])[0];
}

export async function updateTeamCustomRole(
  workspaceId: string,
  teamId: string,
  roleId: string,
  payload: { name?: string; description?: string; permissions?: string[] },
) {
  const data = await updateCustomTeamRole(workspaceId, teamId, roleId, payload);
  return parseTeamCustomRoles([data])[0];
}

export async function removeTeamCustomRole(workspaceId: string, teamId: string, roleId: string) {
  await deleteCustomTeamRole(workspaceId, teamId, roleId);
}

export async function inviteToTeam(
  workspaceId: string,
  teamId: string,
  payload: { email: string; role: string; message?: string },
) {
  await inviteTeamMember(workspaceId, teamId, payload);
}

export async function removeMemberFromTeam(workspaceId: string, teamId: string, memberId: string) {
  await removeTeamMember(workspaceId, teamId, memberId);
}

export async function changeTeamMemberRole(
  workspaceId: string,
  teamId: string,
  memberId: string,
  role: string,
) {
  await updateTeamMemberRole(workspaceId, teamId, memberId, role);
}

export async function changeTeamMemberCustomRole(
  workspaceId: string,
  teamId: string,
  memberId: string,
  roleId: string | null,
) {
  await updateTeamMemberCustomRole(workspaceId, teamId, memberId, roleId);
}

export async function updateTeamMemberProfile(
  workspaceId: string,
  teamId: string,
  memberId: string,
  payload: { nickname?: string | null; avatarUrl?: string | null },
) {
  await Promise.all([
    updateTeamMemberNickname(workspaceId, teamId, memberId, payload.nickname),
    updateTeamMemberAvatar(workspaceId, teamId, memberId, payload.avatarUrl),
  ]);
}
