// hooks/workspace.constants.ts
export const ACTIVE_WORKSPACE_ID_KEY = "activeWorkspaceId";
export const ACCESS_TOKEN_KEY = "accessToken";

export const WORKSPACE_EVENTS = {
  REFRESH: "workspaces:refresh",
  SELECT: "workspace:select",
} as const;
