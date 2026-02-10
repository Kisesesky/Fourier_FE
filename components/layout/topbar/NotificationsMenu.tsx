// components/layout/topbar/NotificationsMenu.tsx
'use client';

import clsx from "clsx";
import { Bell } from "lucide-react";
import type { MutableRefObject } from "react";

import type { NotificationItem } from "@/lib/notifications";

type NotificationsMenuProps = {
  open: boolean;
  unreadCount: number;
  loading: boolean;
  notifications: NotificationItem[];
  containerRef: MutableRefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onClose: () => void;
  onMarkAllRead: () => Promise<void>;
  onInviteAction: (notification: NotificationItem, action: "accept" | "reject") => Promise<void>;
  onOpenFriendRequest: (notification: NotificationItem) => Promise<void>;
};

export default function NotificationsMenu({
  open,
  unreadCount,
  loading,
  notifications,
  containerRef,
  onToggle,
  onClose,
  onMarkAllRead,
  onInviteAction,
  onOpenFriendRequest,
}: NotificationsMenuProps) {
  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-accent hover:text-foreground"
        aria-label="Notifications"
        onClick={onToggle}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-80 rounded-2xl border border-border bg-panel p-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">알림</p>
            <button
              type="button"
              className="text-xs text-muted hover:text-foreground"
              onClick={onMarkAllRead}
            >
              모두 읽음
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {loading ? (
              <div className="rounded-xl border border-border bg-accent px-3 py-4 text-sm text-muted">
                알림을 불러오는 중...
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-xl border border-border bg-accent px-3 py-4 text-sm text-muted">
                새로운 알림이 없습니다.
              </div>
            ) : (
              notifications.map((notice) => {
                const normalizedType = String(notice.type ?? "").toUpperCase();
                const isInvite = normalizedType === "INVITE" || normalizedType === "TEAM_INVITE";
                const isFriendRequest = normalizedType === "FRIEND_REQUEST";
                const payload = notice.payload ?? {};
                const teamName = payload.teamName ?? "팀";
                const role = payload.role?.toLowerCase?.() ?? "member";
                const message = payload.message as string | undefined;
                const requesterName = payload.requesterName ?? "사용자";
                const roleLabel =
                  role === "owner"
                    ? "Owner"
                    : role === "manager"
                      ? "Manager"
                      : role === "guest"
                        ? "Guest"
                        : "Member";
                return (
                  <div
                    key={notice.id}
                    className={clsx(
                      "rounded-xl border border-border px-3 py-3 text-sm",
                      notice.read ? "bg-panel text-muted" : "bg-accent text-foreground"
                    )}
                  >
                    <p className="font-semibold">
                      {isInvite ? "팀 초대 알림" : isFriendRequest ? "친구 요청 알림" : "알림"}
                    </p>
                    {isInvite ? (
                      <>
                        <p className="mt-1 text-xs text-muted">팀: {teamName}</p>
                        <p className="mt-1 text-xs text-muted">역할: {roleLabel}</p>
                        <p className="mt-1 text-xs text-muted">
                          초대 메시지: {message?.trim() ? message : "—"}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(notice.createdAt).toLocaleString()}
                        </p>
                      </>
                    ) : isFriendRequest ? (
                      <>
                        <p className="mt-1 text-xs text-muted">{requesterName} 님이 친구 요청을 보냈습니다.</p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(notice.createdAt).toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-muted">
                        {new Date(notice.createdAt).toLocaleString()}
                      </p>
                    )}
                    {isInvite && !notice.read && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="flex-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
                          onClick={() => onInviteAction(notice, "accept")}
                        >
                          수락
                        </button>
                        <button
                          type="button"
                          className="flex-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground"
                          onClick={() => onInviteAction(notice, "reject")}
                        >
                          거절
                        </button>
                      </div>
                    )}
                    {isFriendRequest && !notice.read && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="flex-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
                          onClick={async () => {
                            await onOpenFriendRequest(notice);
                            onClose();
                          }}
                        >
                          친구요청 보기
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
