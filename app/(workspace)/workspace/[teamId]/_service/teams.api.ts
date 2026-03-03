// app/(workspace)/workspace/[teamId]/_service/teams.api.ts
import { z } from "zod";
import { fetchTeamMembers, fetchTeams } from "@/lib/team";
import { TeamBaseSchema, TeamMemberSummarySchema } from "../_model/schemas/team-api.schemas";
import type { Team } from "@/types/workspace";

export async function listTeams(workspaceId: string) {
  const rows = await fetchTeams(workspaceId);
  const parsed = z.array(TeamBaseSchema).safeParse(rows ?? []);
  return parsed.success ? (parsed.data as Team[]) : [];
}

export async function listTeamMembersSummary(workspaceId: string, teamId: string) {
  const rows = await fetchTeamMembers(workspaceId, teamId);
  const parsed = z.array(TeamMemberSummarySchema).safeParse(rows ?? []);
  return parsed.success ? parsed.data : [];
}

export async function listEnrichedTeams(workspaceId: string, userId?: string) {
  const baseTeams = await listTeams(workspaceId);
  return Promise.all(
    baseTeams.map(async (team) => {
      try {
        const members = await listTeamMembersSummary(workspaceId, team.id);
        const me = userId ? members.find((member) => member.userId === userId) : null;
        return {
          ...team,
          members: members.length,
          role: me?.role ?? team.role,
        };
      } catch {
        return team;
      }
    }),
  );
}
