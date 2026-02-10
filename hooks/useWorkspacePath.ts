// hooks/useWorkspacePath.ts
'use client';

import { useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";

import { parseWorkspacePath, type WorkspacePathInfo } from "@/lib/workspacePath";

type WorkspaceTarget = string | string[] | null | undefined;

export function useWorkspacePath() {
  const rawPathname = usePathname();
  const pathname = rawPathname ?? "";
  const workspace = useMemo<WorkspacePathInfo | null>(() => parseWorkspacePath(pathname), [pathname]);

  const buildHref = useCallback(
    (target?: WorkspaceTarget, fallback = "/") => {
      if (!workspace) return fallback;
      const segments = Array.isArray(target)
        ? target.filter((segment): segment is string => typeof segment === "string" && segment.length > 0)
        : target
          ? [target]
          : [];
      if (segments.length === 0) {
        return workspace.basePath;
      }
      return `${workspace.basePath}/${segments.join("/")}`;
    },
    [workspace],
  );

  const isActive = useCallback(
    (surface?: string | null, fallback?: string) => {
      if (!pathname) return false;
      if (workspace) {
        if (!surface) {
          return pathname === workspace.basePath;
        }
        return pathname.startsWith(`${workspace.basePath}/${surface}`);
      }
      if (!fallback) return false;
      return pathname.startsWith(fallback);
    },
    [pathname, workspace],
  );

  return { pathname, workspace, buildHref, isActive };
}
