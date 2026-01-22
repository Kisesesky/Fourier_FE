// components/members/MemberAvatar.tsx

import clsx from "clsx";
import type { Member, PresenceStatus } from "@/workspace/members/_model/types";

type Props = {
  member: Member;
  size?: number;
  presence?: PresenceStatus;
  ring?: boolean;
};

const presenceColor: Record<PresenceStatus, string> = {
  online: "bg-emerald-500",
  away: "bg-amber-400",
  dnd: "bg-rose-500",
  offline: "bg-slate-400",
};

const FALLBACK_COLORS = [
  "bg-rose-100 text-rose-600",
  "bg-amber-100 text-amber-600",
  "bg-emerald-100 text-emerald-600",
  "bg-sky-100 text-sky-600",
  "bg-violet-100 text-violet-600",
  "bg-slate-100 text-slate-600",
];

const presenceRing: Record<PresenceStatus, string> = {
  online: "bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-100",
  away: "bg-gradient-to-r from-amber-200 via-amber-300 to-amber-100",
  dnd: "bg-gradient-to-r from-rose-200 via-rose-300 to-rose-100",
  offline: "bg-gradient-to-r from-slate-200 via-slate-300 to-slate-100",
};

export default function MemberAvatar({ member, size = 48, presence = "offline", ring = false }: Props) {
  const initials = getInitials(member.name);
  const colorClass = FALLBACK_COLORS[hashString(member.id) % FALLBACK_COLORS.length];
  const outerSize = ring ? size + 12 : size;

  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center rounded-full",
        ring && presenceRing[presence],
      )}
      style={{ width: outerSize, height: outerSize }}
    >
      <div
        className={clsx(
          "flex items-center justify-center rounded-full border border-white/40 bg-background p-0.5 shadow-inner",
          ring && "border-transparent",
        )}
        style={{ width: size, height: size }}
      >
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt={member.name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div
            className={clsx(
              "flex h-full w-full items-center justify-center rounded-full text-sm font-semibold",
              colorClass,
            )}
          >
            {initials}
          </div>
        )}
      </div>
      {!ring && (
        <span
          className={clsx(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-panel",
            presenceColor[presence],
          )}
        />
      )}
    </div>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
