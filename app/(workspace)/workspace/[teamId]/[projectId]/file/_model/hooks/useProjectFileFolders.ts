// app/(workspace)/workspace/[teamId]/[projectId]/file/_model/hooks/useProjectFileFolders.ts
'use client';

import { useCallback, useEffect, useState } from "react";

import { FILE_VAULT_EVENT } from "@/workspace/file/_model/vault";
import { listFileFolders, type FileFolderDto } from "@/workspace/file/_service/api";

export function useProjectFileFolders(projectId?: string) {
  const [folders, setFolders] = useState<FileFolderDto[]>([]);

  const reload = useCallback(async () => {
    if (!projectId) {
      setFolders([]);
      return;
    }
    try {
      const data = await listFileFolders(projectId);
      setFolders(data);
    } catch {
      setFolders([]);
    }
  }, [projectId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onChanged = () => void reload();
    window.addEventListener(FILE_VAULT_EVENT, onChanged);
    return () => window.removeEventListener(FILE_VAULT_EVENT, onChanged);
  }, [reload]);

  return { folders, reload };
}

