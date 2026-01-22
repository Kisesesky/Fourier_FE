// src/hooks/useTeams.ts
import { useEffect, useState } from "react";
import type { Team } from "@/types/workspace";
import { fetchTeams } from "@/lib/team";

export function useTeams(workspaceId: string) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchTeams(workspaceId)
      .then(setTeams)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [workspaceId]);

  return { teams, loading, error };
}
