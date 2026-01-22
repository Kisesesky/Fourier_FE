// src/hooks/useWorkspace.ts
import { useEffect, useState } from "react";
import type { Workspace } from "@/types/workspace";
import { fetchMyWorkspace } from "@/lib/workspace";

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchMyWorkspace()
      .then(setWorkspace)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { workspace, loading, error };
}
