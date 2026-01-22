// src/lib/team.ts
import type { Team } from "@/types/workspace";
import api from "./api";

export async function fetchTeams(workspaceId: string): Promise<Team[]> {
  const res = await api.get(`/workspace/${workspaceId}/team`);
  return (res.data ?? []).map((team: { id: string; name: string }) => ({
    id: team.id,
    name: team.name,
    role: "Member",
    members: 0,
  }));
}
