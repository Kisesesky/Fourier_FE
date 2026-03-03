// hooks/useWorkspace.ts
import { useCallback, useEffect, useState } from "react";
import type { Workspace } from "@/types/workspace";
import { ACCESS_TOKEN_KEY, ACTIVE_WORKSPACE_ID_KEY, WORKSPACE_EVENTS } from "./workspace.constants";
import { WorkspaceSelectEventSchema } from "./workspace.schemas";
import { listMyWorkspaces } from "./workspace.service";

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (typeof window !== "undefined" && !localStorage.getItem(ACCESS_TOKEN_KEY)) {
      setWorkspaces([]);
      setActiveWorkspaceId(null);
      setWorkspace(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await listMyWorkspaces();
      setWorkspaces(data);
      const storedId = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_WORKSPACE_ID_KEY) : null;
      const nextId = data.find((item) => item.id === storedId)?.id ?? data[0]?.id ?? null;
      if (nextId) {
        if (typeof window !== "undefined") {
          localStorage.setItem(ACTIVE_WORKSPACE_ID_KEY, nextId);
        }
        setActiveWorkspaceId(nextId);
        setWorkspace(data.find((item) => item.id === nextId) ?? null);
      } else {
        setActiveWorkspaceId(null);
        setWorkspace(null);
      }
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch().catch(() => {});
  }, [refetch]);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    const next = workspaces.find((item) => item.id === activeWorkspaceId) ?? null;
    setWorkspace(next);
  }, [activeWorkspaceId, workspaces]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleRefresh = () => {
      refetch().catch(() => {});
    };
    const handleSelect = (event: Event) => {
      const detail = (event as CustomEvent<{ workspaceId?: string }>).detail;
      const parsed = WorkspaceSelectEventSchema.safeParse(detail ?? {});
      const id = parsed.success ? parsed.data.workspaceId : undefined;
      if (!id) return;
      localStorage.setItem(ACTIVE_WORKSPACE_ID_KEY, id);
      setActiveWorkspaceId(id);
    };
    window.addEventListener(WORKSPACE_EVENTS.REFRESH, handleRefresh);
    window.addEventListener(WORKSPACE_EVENTS.SELECT, handleSelect);
    return () => {
      window.removeEventListener(WORKSPACE_EVENTS.REFRESH, handleRefresh);
      window.removeEventListener(WORKSPACE_EVENTS.SELECT, handleSelect);
    };
  }, [refetch]);

  return {
    workspace,
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    loading,
    error,
    refetch,
  };
}
