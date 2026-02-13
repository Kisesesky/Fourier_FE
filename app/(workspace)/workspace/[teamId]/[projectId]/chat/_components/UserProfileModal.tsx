// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/UserProfileModal.tsx
'use client';

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ellipsis, Pencil, Send } from "lucide-react";
import type { ChatUser } from "@/workspace/chat/_model/types";

type UserProfileModalProps = {
  open: boolean;
  user?: ChatUser;
  anchorRect?: { top: number; left: number; right: number; bottom: number };
  currentUserId: string;
  onClose: () => void;
  onSendDm: (payload: { userId: string; text: string }) => Promise<void>;
  onEditProfile: (userId: string) => void;
  onOpenFullProfile: (userId: string) => void;
  onIgnore: (userId: string) => void;
  onBlock: (userId: string) => void;
};

const roleLabel: Record<NonNullable<ChatUser["role"]>, string> = {
  owner: "소유자",
  manager: "관리자",
  member: "멤버",
  guest: "게스트",
};

const roleBadgeClass: Record<NonNullable<ChatUser["role"]>, string> = {
  owner: "bg-rose-500 text-rose-100",
  manager: "bg-emerald-500 text-emerald-100",
  member: "bg-sky-500 text-sky-100",
  guest: "bg-slate-500 text-slate-100",
};

export default function UserProfileModal({
  open,
  user,
  anchorRect,
  currentUserId,
  onClose,
  onSendDm,
  onEditProfile,
  onOpenFullProfile,
  onIgnore,
  onBlock,
}: UserProfileModalProps) {
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user) return;
    setDraft("");
    setMenuOpen(false);
  }, [user?.id, open]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open || !user) return null;

  const initials = (user.name || "?").slice(0, 2).toUpperCase();
  const displayName = user.displayName || user.name;
  const role = user.role ?? "member";
  const roleText = roleLabel[role] ?? "멤버";
  const canSend = draft.trim().length > 0;
  const coverImage = user.backgroundImageUrl || "/error/profile.png";
  const isMe = user.id === currentUserId;
  const panelWidth = 392;
  const panelHeight = 384;
  const margin = 12;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1440;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 900;
  const position = (() => {
    if (!anchorRect) {
      return { top: 80, left: Math.max(margin, viewportWidth - panelWidth - 16) };
    }
    let left = anchorRect.right + 8;
    if (left + panelWidth > viewportWidth - margin) {
      left = anchorRect.left - panelWidth - 8;
    }
    left = Math.max(margin, Math.min(left, viewportWidth - panelWidth - margin));

    let top = anchorRect.top;
    top = Math.max(margin, Math.min(top, viewportHeight - panelHeight - margin));
    return { top, left };
  })();

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button type="button" className="absolute inset-0 bg-black/20" aria-label="프로필 닫기" onClick={onClose} />
      <div
        className="absolute z-[91] h-[24rem] w-[min(90vw,392px)] overflow-hidden rounded-2xl border border-border bg-panel shadow-panel"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        <div className="relative h-44">
          <img src={coverImage} alt="profile background" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute right-3 top-3" ref={menuRef}>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-black/45 text-white transition hover:bg-black/60"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="프로필 메뉴"
            >
              <Ellipsis size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 w-40 rounded-md border border-border bg-panel py-1 shadow-lg">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-foreground transition hover:bg-subtle/80"
                  onClick={() => {
                    onOpenFullProfile(user.id);
                    setMenuOpen(false);
                    onClose();
                  }}
                >
                  전체 프로필 보기
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-muted transition hover:bg-subtle/80 hover:text-foreground"
                  onClick={() => {
                    onIgnore(user.id);
                    setMenuOpen(false);
                  }}
                >
                  무시하기
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-rose-500 transition hover:bg-rose-500/10"
                  onClick={() => {
                    onBlock(user.id);
                    setMenuOpen(false);
                  }}
                >
                  차단하기
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute left-3 top-3 rounded-md bg-black/45 px-2 py-1 text-xs font-semibold text-white transition hover:bg-black/60"
          >
            닫기
          </button>
          <div className="absolute -bottom-12 left-5 h-24 w-24 overflow-hidden rounded-full bg-muted/20 shadow-xl">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
        </div>

        <div className="flex h-[calc(100%-11rem)] flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 px-5 pb-4 pt-14 text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-xl font-semibold text-foreground">{displayName}</p>
                <span className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${roleBadgeClass[role]}`}>
                  {roleText}
                </span>
              </div>
                <p className="truncate text-sm text-muted">{user.name}</p>
            </div>

          </div>
          {!isMe && (
            <div className="border-t border-border/70 p-4">
              <div className="flex items-center gap-2 text-left">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && canSend) {
                      void onSendDm({ userId: user.id, text: draft.trim() }).then(() => setDraft(""));
                    }
                  }}
                  className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-brand"
                  placeholder="DM 보내기 입력창"
                />
                <button
                  type="button"
                  disabled={!canSend}
                  className="inline-flex h-10 items-center gap-1 rounded-md bg-brand px-3 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    if (!canSend) return;
                    void onSendDm({ userId: user.id, text: draft.trim() }).then(() => setDraft(""));
                  }}
                >
                  <Send size={14} />
                  DM 보내기
                </button>
              </div>
            </div>
          )}
          {isMe && (
            <div className="border-t border-border/70 p-4">
              <button
                type="button"
                className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-md bg-brand px-3 text-sm font-semibold text-white transition hover:bg-brand/90"
                onClick={() => {
                  onEditProfile(user.id);
                  onClose();
                }}
              >
                <Pencil size={14} />
                프로필 편집
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
