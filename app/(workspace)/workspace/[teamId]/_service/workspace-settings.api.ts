// app/(workspace)/workspace/[teamId]/_service/workspace-settings.api.ts
import { fetchProjects } from "@/lib/projects";
import { fetchTeams } from "@/lib/team";

export async function getWorkspaceContext(
  workspaceId: string | null | undefined,
  teamId: string,
  projectId: string,
) {
  let teamName = "Team";
  let teamIconValue: string | null = null;
  let projectName = "Project";
  let projectIconValue: string | null = null;

  if (workspaceId) {
    try {
      const teams = await fetchTeams(workspaceId);
      const foundTeam = teams.find((team) => team.id === teamId);
      teamName = foundTeam?.name ?? "Team";
      teamIconValue = foundTeam?.iconValue ?? null;
    } catch {
      teamName = "Team";
      teamIconValue = null;
    }
  }

  try {
    const projects = await fetchProjects(teamId);
    const foundProject = projects.find((project: { id: string; name: string; iconValue?: string | null }) => project.id === projectId);
    projectName = foundProject?.name ?? "Project";
    projectIconValue = foundProject?.iconValue ?? null;
  } catch {
    projectName = "Project";
    projectIconValue = null;
  }

  return { teamName, teamIconValue, projectName, projectIconValue };
}
