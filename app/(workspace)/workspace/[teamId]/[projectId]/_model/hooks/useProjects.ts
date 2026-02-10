// app/(workspace)/workspace/[teamId]/[projectId]/_model/hooks/useProjects.ts
import { useCallback, useEffect, useState } from "react";
import { Project } from "@/types/project";
import { fetchProjects } from "@/lib/projects";

export function useProjects(teamId?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (signal?: AbortSignal) => {
    if (!teamId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchProjects(teamId, signal);
      setProjects(data);
    } catch (err: any) {
      if (err?.name !== "CanceledError") {
        setError("프로젝트를 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;

    const controller = new AbortController();
    refetch(controller.signal);

    return () => controller.abort();
  }, [teamId, refetch]);

  return { projects, loading, error, refetch };
}
