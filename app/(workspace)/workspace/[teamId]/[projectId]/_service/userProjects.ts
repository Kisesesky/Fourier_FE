// app/(workspace)/workspcae/[teamId]/_service/useProjects.tsx
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { Project } from "@/types/project";

export function useProjects(teamId?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    api
      .get(`/team/${teamId}/project`, { signal: controller.signal })
      .then(res => setProjects(res.data))
      .catch(err => {
        if (err.name !== "CanceledError") {
          setError("프로젝트를 불러오지 못했습니다.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [teamId]);

  return { projects, loading, error };
}