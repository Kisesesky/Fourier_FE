// app/(workspace)/workspace/[teamId]/[projectId]/members/_service/api.ts
import {
  addProjectMember,
  fetchProjectMembers,
  fetchProjects,
  removeProjectMember,
  updateProjectMemberRole,
} from "@/lib/projects";
import { fetchTeamMembers } from "@/lib/team";
import { parseProjectMembers, parseTeamMembers } from "@/workspace/members/_model/schemas/member.schemas";
import type { Member } from "@/workspace/members/_model/types";

export async function listProjectMembers(teamId: string, projectId: string) {
  const data = await fetchProjectMembers(teamId, projectId);
  return parseProjectMembers(data);
}

export async function listTeamMembers(workspaceId: string, teamId: string) {
  const data = await fetchTeamMembers(workspaceId, teamId);
  return parseTeamMembers(data);
}

export async function getProjectName(teamId: string, projectId: string) {
  const items = await fetchProjects(teamId);
  const current = (items ?? []).find((item: { id: string; name?: string }) => item.id === projectId);
  return current?.name ?? "";
}

export async function inviteProjectMember(
  teamId: string,
  projectId: string,
  payload: { userId: string; role: "OWNER" | "MANAGER" | "MEMBER" | "GUEST" },
) {
  await addProjectMember(teamId, projectId, payload);
}

export async function removeMemberFromProject(teamId: string, projectId: string, userId: string) {
  await removeProjectMember(teamId, projectId, userId);
}

export async function changeProjectMemberRole(
  teamId: string,
  projectId: string,
  payload: { userId: string; role: "OWNER" | "MANAGER" | "MEMBER" | "GUEST" },
) {
  await updateProjectMemberRole(teamId, projectId, payload);
}

export const mapMemberRoleToProjectRole = (role: Member["role"]): "OWNER" | "MANAGER" | "MEMBER" | "GUEST" => {
  switch (role) {
    case "owner":
      return "OWNER";
    case "manager":
      return "MANAGER";
    case "guest":
      return "GUEST";
    default:
      return "MEMBER";
  }
};

