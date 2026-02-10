// hooks/useWorkspaceUser.ts
'use client';

import { useMemo } from "react";
import { useChat } from "@/workspace/chat/_model/store";

export const useWorkspaceUser = () => {
  const { me, users } = useChat((state) => ({ me: state.me, users: state.users }));
  const currentUser = users?.[me?.id ?? ""] ?? me;
  const userFallback = useMemo(() => {
    const base = currentUser?.name?.trim() || "User";
    return base
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [currentUser?.name]);
  return { currentUser, userFallback };
};
