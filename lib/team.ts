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
  role: string;
};

export async function fetchTeamMembers(workspaceId: string, teamId: string): Promise<TeamMember[]> {
  const res = await api.get(`/workspace/${workspaceId}/team/${teamId}/members`);
  return res.data ?? [];
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
