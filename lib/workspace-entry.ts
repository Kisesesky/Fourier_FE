// lib/workspace-entry.ts
import { fetchProjects } from "@/lib/projects";
import { fetchTeams } from "@/lib/team";
import { fetchMyWorkspaces } from "@/lib/workspace";

type ProjectLike = { id: string };
type TeamLike = { id: string };
type WorkspaceLike = { id: string };

const PREF_KEYS = {
  workspaceId: "activeWorkspaceId",
  teamId: "lastTeamId",
  projectId: "lastProjectId",
  path: "lastWorkspacePath",
} as const;

function getPref(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function prioritizeById<T extends { id: string }>(items: T[], preferredId: string | null): T[] {
  if (!preferredId) return items;
  const preferred = items.find((item) => item.id === preferredId);
  if (!preferred) return items;
  return [preferred, ...items.filter((item) => item.id !== preferredId)];
}

export function saveWorkspaceEntryPreference(input: {
  workspaceId?: string | null;
  teamId?: string | null;
  projectId?: string | null;
  path?: string | null;
}) {
  if (typeof window === "undefined") return;

  if (input.workspaceId) localStorage.setItem(PREF_KEYS.workspaceId, input.workspaceId);
  if (input.teamId) localStorage.setItem(PREF_KEYS.teamId, input.teamId);
  if (input.projectId) localStorage.setItem(PREF_KEYS.projectId, input.projectId);
  if (input.path) localStorage.setItem(PREF_KEYS.path, input.path);
}

function buildWorkspacePath(teamId: string, projectId: string) {
  return `/workspace/${encodeURIComponent(teamId)}/${encodeURIComponent(projectId)}`;
}

export async function resolveWorkspaceEntryPath(): Promise<string | null> {
  const workspaces = await fetchMyWorkspaces();
  if (!Array.isArray(workspaces) || workspaces.length === 0) {
    return null;
  }

  const preferredWorkspaceId = getPref(PREF_KEYS.workspaceId);
  const preferredTeamId = getPref(PREF_KEYS.teamId);
  const preferredProjectId = getPref(PREF_KEYS.projectId);

  const prioritizedWorkspaces = prioritizeById<WorkspaceLike>(workspaces as WorkspaceLike[], preferredWorkspaceId);

  for (const workspace of prioritizedWorkspaces) {
    const teams = await fetchTeams(workspace.id);
    if (!Array.isArray(teams) || teams.length === 0) continue;

    const prioritizedTeams = prioritizeById<TeamLike>(teams as TeamLike[], preferredTeamId);

    for (const team of prioritizedTeams) {
      const projects = await fetchProjects(team.id);
      if (!Array.isArray(projects) || projects.length === 0) continue;

      const prioritizedProjects = prioritizeById<ProjectLike>(projects as ProjectLike[], preferredProjectId);
      const project = prioritizedProjects[0];
      if (!project?.id) continue;

      const path = buildWorkspacePath(team.id, project.id);
      saveWorkspaceEntryPreference({
        workspaceId: workspace.id,
        teamId: team.id,
        projectId: project.id,
        path,
      });
      return path;
    }
  }

  return null;
}
