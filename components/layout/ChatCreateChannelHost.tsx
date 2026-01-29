// components/layout/ChatCreateChannelHost.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreateChannelModal } from "@/workspace/chat/_components/ChannelModals";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";

export default function ChatCreateChannelHost() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { buildHref } = useWorkspacePath();

  useEffect(() => {
    const handler = () => setOpen(true);
    if (typeof window === "undefined") return;
    window.addEventListener("chat:open-create-channel", handler);
    return () => window.removeEventListener("chat:open-create-channel", handler);
  }, []);

  return (
    <CreateChannelModal
      open={open}
      onOpenChange={setOpen}
      onCreated={(id) => {
        const href = buildHref(["chat", encodeURIComponent(id)], `/chat/${encodeURIComponent(id)}`);
        router.push(href);
      }}
    />
  );
}
