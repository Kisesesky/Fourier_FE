// src/hooks/useWorkspace.ts
import { useCallback, useEffect, useState } from "react";
import type { Workspace } from "@/types/workspace";
import { fetchMyWorkspaces } from "@/lib/workspace";

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyWorkspaces();
      setWorkspaces(data);
      const storedId = typeof window !== "undefined" ? localStorage.getItem("activeWorkspaceId") : null;
      const nextId = data.find((item) => item.id === storedId)?.id ?? data[0]?.id ?? null;
      if (nextId) {
        if (typeof window !== "undefined") {
          localStorage.setItem("activeWorkspaceId", nextId);
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
      const id = detail?.workspaceId;
      if (!id) return;
      localStorage.setItem("activeWorkspaceId", id);
      setActiveWorkspaceId(id);
    };
    window.addEventListener("workspaces:refresh", handleRefresh);
    window.addEventListener("workspace:select", handleSelect);
    return () => {
      window.removeEventListener("workspaces:refresh", handleRefresh);
      window.removeEventListener("workspace:select", handleSelect);
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
