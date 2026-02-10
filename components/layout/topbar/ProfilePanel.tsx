// components/layout/topbar/ProfilePanel.tsx
'use client';

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import MemberProfilePanel from "@/workspace/members/_components/MemberProfilePanel";
import type { UserPresenceStatus } from "@/lib/presence";

type ProfilePanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId?: string;
  currentUserId?: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  backgroundImageUrl?: string;
  bio?: string;
  presence: UserPresenceStatus;
  onPresenceChange: (status: UserPresenceStatus) => void;
  onProfileSave: (patch: {
    displayName?: string;
    avatarUrl?: string | null;
    backgroundImageUrl?: string | null;
    bio?: string;
  }) => Promise<void>;
};

export default function ProfilePanel({
  open,
  onOpenChange,
  profileId,
  currentUserId,
  displayName,
  email,
  avatarUrl,
  backgroundImageUrl,
  bio,
  presence,
  onPresenceChange,
  onProfileSave,
}: ProfilePanelProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-20 z-50 w-[500px] max-w-[92vw] -translate-x-1/2 rounded-2xl border border-border bg-panel p-5 shadow-panel focus:outline-none">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-foreground">프로필 편집</Dialog.Title>
            <Dialog.Close className="rounded-full border border-border/70 p-1 text-muted transition hover:text-foreground" aria-label="닫기">
              <X size={16} />
            </Dialog.Close>
          </div>
          <MemberProfilePanel
            member={{
              id: profileId ?? currentUserId ?? "me",
              name: displayName,
              displayName,
              email: email ?? "",
              avatarUrl,
              backgroundImageUrl,
              description: bio,
              role: "member",
              joinedAt: Date.now(),
              lastActiveAt: Date.now(),
            }}
            presence={{
              memberId: profileId ?? "me",
              status: presence,
              lastSeenAt: Date.now(),
            }}
            canEditPresence
            canEditProfile
            canRemove={false}
            onPresenceChange={onPresenceChange}
            onProfileSave={onProfileSave}
            onCancel={() => onOpenChange(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
