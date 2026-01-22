// lib/workspacePath.ts

export type WorkspacePathInfo = {
  teamId: string;
  projectId: string;
  basePath: string;
  surface?: string;
};

export function parseWorkspacePath(pathname?: string | null): WorkspacePathInfo | null {
  if (!pathname) return null;
  const match = pathname.match(/^\/workspace\/([^/]+)\/([^/]+)(?:\/([^/]+))?/);
  if (!match) return null;
  const [, teamId, projectId, surface] = match;
  return {
    teamId,
    projectId,
    basePath: `/workspace/${teamId}/${projectId}`,
    surface,
  };
}
