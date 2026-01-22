// components/members/MemberCard.tsx

import clsx from "clsx";
import { Clock3, Mail, MapPin, Star, Trash2 } from "lucide-react";
import type { Member, MemberPresence, PresenceStatus } from "@/workspace/members/_model/types";
import MemberAvatar from "./MemberAvatar";

type MemberCardProps = {
  member: Member;
  presence?: MemberPresence;
  selected?: boolean;
  onSelect?: () => void;
  onToggleFavorite?: () => void;
  onRemove?: () => void;
};

export default function MemberCard({
  member,
  presence,
  selected = false,
  onSelect,
  onToggleFavorite,
  onRemove,
}: MemberCardProps) {
  const status: PresenceStatus = presence?.status ?? "offline";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "group relative w-full overflow-hidden rounded-[28px] border px-6 py-6 text-left transition",
        selected
          ? "border-brand/60 bg-gradient-to-br from-brand/15 via-panel/90 to-panel shadow-[0_15px_40px_rgba(15,23,42,0.25)]"
          : "border-border/80 bg-gradient-to-br from-panel/90 via-panel/70 to-background hover:border-brand/30 hover:shadow-[0_12px_30px_rgba(15,23,42,0.18)]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-60">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
      </div>

      <div className="relative flex flex-wrap items-start gap-6">
        <MemberAvatar member={member} presence={status} size={72} ring />

        <div className="flex-1 min-w-[240px] space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-xl font-semibold tracking-tight text-foreground">{member.name}</span>
            <span className="rounded-full border border-border/60 bg-background/70 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.3em] text-muted">
              {member.role}
            </span>
            {member.title && (
              <span className="rounded-full border border-border/50 bg-background/70 px-2.5 py-0.5 text-[11px] text-foreground">
                {member.title}
              </span>
            )}
            {member.isFavorite && (
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-100 to-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600 shadow-inner">
                <Star size={12} className="text-amber-500" fill="currentColor" />
              </span>
            )}
            <span className="rounded-full border border-border/60 bg-background/70 px-2.5 py-0.5 text-[11px] text-muted">
              {statusLabel(status)}
            </span>
            {member.statusMessage && (
              <span className="rounded-full border border-border/50 bg-background/80 px-2.5 py-0.5 text-[11px] text-foreground">
                {member.statusMessage}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-2.5 py-0.5">
              <Mail size={13} />
              {member.email}
            </span>
            {member.location && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-2.5 py-0.5">
                <MapPin size={13} />
                {member.location}
              </span>
            )}
            {member.timezone && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-2.5 py-0.5">
                <Clock3 size={13} />
                {member.timezone}
              </span>
            )}
          </div>

          {member.description && (
            <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-2 text-sm text-muted">
              {member.description}
            </div>
          )}

          {member.tags && member.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              {member.tags.map((tag) => (
                <span
                  key={`${member.id}-${tag}`}
                  className="rounded-full border border-border/70 bg-background/70 px-3 py-0.5 uppercase tracking-wide"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite?.();
            }}
            className={clsx(
              "inline-flex h-10 w-10 items-center justify-center rounded-full border text-muted shadow-inner transition",
              member.isFavorite
                ? "border-amber-200 bg-amber-50 text-amber-500"
                : "border-border bg-background/70 hover:border-border/70 hover:text-foreground",
            )}
            aria-label="즐겨찾기 토글"
          >
            <Star size={16} className={clsx(member.isFavorite ? "text-amber-500" : "text-muted")} fill={member.isFavorite ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove?.();
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/70 text-muted transition hover:border-rose-200 hover:text-rose-500"
            aria-label="멤버 삭제"
          >
            <Trash2 size={16} />
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
