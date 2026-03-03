// app/(workspace)/workspace/[teamId]/_model/hooks/useTeams.ts
import { useCallback, useEffect, useState } from "react";
import type { Team } from "@/types/workspace";
import { listEnrichedTeams } from "../../_service/teams.api";

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

    const enriched = await listEnrichedTeams(workspaceId, userId);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleRefresh = () => {
      refetch().catch(() => {});
    };
    window.addEventListener("teams:refresh", handleRefresh);
    return () => {
      window.removeEventListener("teams:refresh", handleRefresh);
    };
  }, [refetch]);

  return { teams, loading, error, refetch };
}
