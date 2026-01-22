// components/members/MemberProfilePanel.tsx

import { Mail, MapPin, ShieldCheck } from "lucide-react";
import type { Member, MemberPresence, PresenceStatus } from "@/workspace/members/_model/types";
import MemberAvatar from "./MemberAvatar";

type Props = {
  member: Member | null;
  presence?: MemberPresence;
  onPresenceChange?: (status: PresenceStatus) => void;
  onRemove?: (memberId: string) => void;
};

const presenceLabels: Record<PresenceStatus, string> = {
  online: "온라인",
  away: "자리비움",
  dnd: "방해 금지",
  offline: "오프라인",
};

const presenceOptions: PresenceStatus[] = ["online", "away", "dnd", "offline"];

export default function MemberProfilePanel({ member, presence, onPresenceChange, onRemove }: Props) {
  if (!member) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-panel/40 p-6 text-center text-sm text-muted">
        멤버를 선택하면 프로필과 최근 활동을 확인할 수 있어요.
      </div>
    );
  }

  const currentStatus = presence?.status ?? "offline";

  return (
    <div className="rounded-2xl border border-border bg-panel/70 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <MemberAvatar member={member} presence={currentStatus} size={64} />
        <div>
          <div className="text-lg font-semibold">{member.name}</div>
          <div className="text-sm text-muted">{member.title || "Member"}</div>
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck size={16} className="mt-1 text-muted" />
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">역할</dt>
            <dd className="font-medium text-foreground">{member.role}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Mail size={16} className="mt-1 text-muted" />
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">이메일</dt>
            <dd className="font-medium text-foreground break-all">{member.email}</dd>
          </div>
        </div>
        {(member.location || member.timezone) && (
          <div className="flex items-start gap-3">
            <MapPin size={16} className="mt-1 text-muted" />
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">위치</dt>
              <dd className="font-medium text-foreground">
                {member.location}
                {member.timezone && (
                  <span className="ml-1 text-muted">({member.timezone})</span>
                )}
              </dd>
            </div>
          </div>
        )}
      </dl>

      {member.description && (
        <div className="mt-5 rounded-xl border border-border bg-background/80 p-3 text-sm text-muted">
          {member.description}
        </div>
      )}

      <div className="mt-5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">온라인 상태</label>
        <select
          value={currentStatus}
          onChange={(event) => onPresenceChange?.(event.target.value as PresenceStatus)}
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
        >
          {presenceOptions.map((status) => (
            <option key={status} value={status}>
              {presenceLabels[status]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted">상태를 바꾸면 실시간 Presence mock 데이터가 업데이트됩니다.</p>
      </div>

      {member.tags && member.tags.length > 0 && (
        <div className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">태그</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {member.tags.map((tag) => (
              <span
                key={`${member.id}-${tag}-detail`}
                className="rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onRemove?.(member.id)}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-500 transition hover:bg-rose-500/10"
      >
        멤버 삭제
      </button>
    </div>
  );
}
