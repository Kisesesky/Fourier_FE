"use client";

import { Suspense, useEffect } from "react";
import { useParams } from "next/navigation";
import { useChat } from "@/workspace/chat/_model/store";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import ThreadsView from "@/workspace/chat/_components/ThreadsView";

export default function WorkspaceChatThreadsPage() {
  const { teamId, projectId } = useParams<{ teamId: string; projectId: string }>();
  const { setContext, setMe } = useChat();
  const { profile } = useAuthProfile();

  useEffect(() => {
    if (!teamId || !projectId) return;
    setContext(decodeURIComponent(teamId), decodeURIComponent(projectId));
  }, [projectId, teamId, setContext]);

  useEffect(() => {
    if (!profile) return;
    setMe({
      id: profile.id,
      name: profile.displayName ?? profile.name ?? profile.email,
      avatarUrl: profile.avatarUrl ?? undefined,
    });
  }, [profile, setMe]);

  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">스레드를 불러오는 중입니다…</div>}>
      <ThreadsView />
    </Suspense>
  );
}
