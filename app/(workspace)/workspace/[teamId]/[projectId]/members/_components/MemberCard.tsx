// components/members/MemberCard.tsx

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Ban, ChevronDown, MessageCircle, Moon, Trash2 } from "lucide-react";
import type { Member, MemberPresence, PresenceStatus } from "@/workspace/members/_model/types";
import MemberAvatar from "./MemberAvatar";

const roleLabel: Record<Member["role"], string> = {
  owner: "소유자",
  manager: "관리자",
  member: "멤버",
  guest: "게스트",
};

type MemberCardProps = {
  member: Member;
  presence?: MemberPresence;
  canEditStatus?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onStatusChange?: (status: PresenceStatus) => void;
  onSendDm?: () => void;
  onRemove?: () => void;
};

export default function MemberCard({
  member,
  presence,
  canEditStatus = false,
  selected = false,
  onSelect,
  onStatusChange,
  onSendDm,
  onRemove,
}: MemberCardProps) {
  const status: PresenceStatus = presence?.status ?? "offline";
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!statusOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setStatusOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setStatusOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onEscape);
    };
  }, [statusOpen]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "w-full border-b border-border/70 px-4 py-3 text-left transition last:border-b-0",
        selected
          ? "bg-brand/10"
          : "hover:bg-subtle/50",
      )}
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_120px_120px_minmax(0,1.2fr)_220px] md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <MemberAvatar member={member} presence={status} size={40} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{member.name}</div>
            <div className="truncate text-xs text-muted">{member.email}</div>
          </div>
        </div>
        <div className="relative w-fit" ref={statusRef}>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (!canEditStatus) return;
              setStatusOpen((prev) => !prev);
            }}
            className={clsx(
              "inline-flex w-fit items-center gap-1.5 rounded-md border border-border bg-background/70 px-2 py-1 text-xs text-muted",
              canEditStatus && "cursor-pointer hover:bg-accent",
            )}
            aria-label={canEditStatus ? "상태 변경" : "상태"}
          >
            <StatusIcon status={status} />
            {statusLabel(status)}
            {canEditStatus && <ChevronDown size={12} className="text-muted" />}
          </button>
          {canEditStatus && statusOpen && (
            <div className="absolute left-0 top-8 z-20 w-32 rounded-md border border-border bg-panel py-1 shadow-md">
              {(["online", "offline", "away", "dnd"] as PresenceStatus[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onStatusChange?.(option);
                    setStatusOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-sidebar-accent"
                >
                  <StatusIcon status={option} />
                  {statusLabel(option)}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="inline-flex w-fit items-center rounded-md border border-border bg-background/70 px-2 py-1 text-xs font-medium text-foreground">
          {roleLabel[member.role] ?? "멤버"}
        </div>
        <div className="truncate text-sm text-muted">{member.description?.trim() || "-"}</div>
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSendDm?.();
            }}
            className="inline-flex h-8 items-center justify-center rounded-md bg-sky-500 px-3 text-xs font-semibold text-white transition hover:bg-sky-600"
            aria-label="DM 보내기"
          >
            <MessageCircle size={16} />
            <span className="ml-1">DM</span>
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove?.();
            }}
            className="inline-flex h-8 items-center justify-center rounded-md bg-rose-500 px-3 text-xs font-semibold text-white transition hover:bg-rose-600"
            aria-label="멤버 삭제"
          >
            <Trash2 size={16} />
            <span className="ml-1">삭제</span>
          </button>
        </div>
      </div>
    </button>
  );
}

function statusLabel(status: PresenceStatus) {
  switch (status) {
    case "online":
      return "온라인";
    case "away":
      return "자리비움";
    case "dnd":
      return "방해 금지";
    default:
      return "오프라인";
  }
}

function StatusIcon({ status }: { status: PresenceStatus }) {
  if (status === "online") return <span className="h-2.5 w-2.5 rounded-full bg-sky-400" aria-hidden />;
  if (status === "offline") return <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" aria-hidden />;
  if (status === "away") return <Moon size={12} className="text-amber-400" aria-hidden />;
  return <Ban size={12} className="text-rose-500" aria-hidden />;
}
