// src/hooks/useTeams.ts
import { useCallback, useEffect, useState } from "react";
import type { Team } from "@/types/workspace";
import { fetchTeamMembers, fetchTeams } from "@/lib/team";

export function useTeams(workspaceId: string, userId?: string) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const baseTeams = await fetchTeams(workspaceId);
    const enriched = await Promise.all(
      baseTeams.map(async (team) => {
        try {
          const members = await fetchTeamMembers(workspaceId, team.id);
          const me = userId ? members.find((member) => member.userId === userId) : null;
          return {
            ...team,
            members: members.length,
            role: me?.role ?? team.role,
          };
        } catch {
          return team;
        }
      })
    );
    setTeams(enriched);
    setLoading(false);
  }, [workspaceId, userId]);

  useEffect(() => {
    let cancelled = false;
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    refetch().catch((err) => {
      if (cancelled) return;
      setError(err);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, refetch]);

  return { teams, loading, error, refetch };
}
