"use client";

import { Suspense } from "react";
import ChatView from "@/workspace/chat/_components/ChatView";

type WorkspaceChatChannelPageProps = {
  params: { channelId: string };
};

export default function WorkspaceChatChannelPage({ params }: WorkspaceChatChannelPageProps) {
  const channelId = decodeURIComponent(params.channelId);
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">채널을 불러오는 중입니다…</div>}>
      <ChatView initialChannelId={channelId} />
    </Suspense>
  );
}
