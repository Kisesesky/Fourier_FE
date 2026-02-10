// hooks/useProject.ts
import api from "@/lib/api";
import { Project } from "@/types/project";
import { useEffect, useState } from "react";

export function useProject(teamId?: string, projectId?: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId || !projectId) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    api
      .get(`/team/${teamId}/project`)
      .then((res) => {
        const found = res.data.find((p: Project) => p.id === projectId);
        if (!found) {
          setError("프로젝트를 찾을 수 없습니다.");
        } else {
          setProject(found);
        }
      })
      .catch(() => {
        setError("프로젝트를 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [teamId, projectId]);

  return { project, loading, error };
}