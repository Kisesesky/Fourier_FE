// app/(workspace)/workspace/[teamId]/_components/views/team-members/PendingInvitesTab.tsx
'use client';

import { TEAM_ROLE_LABELS } from "@/app/(workspace)/workspace/[teamId]/_model/view.constants";
import type { TeamPendingInvite } from "./team-members.types";

type PendingInvitesTabProps = {
  loading: boolean;
  invites: TeamPendingInvite[];
};

export default function PendingInvitesTab({ loading, invites }: PendingInvitesTabProps) {
  return (
    <div className="divide-y divide-border">
      <div className="grid grid-cols-[1.5fr,1fr,1.2fr,1fr,1fr] px-3 pb-3 text-[11px] uppercase tracking-[0.4em] text-muted">
        <span>Email</span>
        <span>Role</span>
        <span>Invited By</span>
        <span>Invited At</span>
        <span>Status</span>
      </div>
      {loading ? (
        <div className="px-3 py-10 text-center text-sm text-muted">초대 목록을 불러오는 중...</div>
      ) : invites.length === 0 ? (
        <div className="px-3 py-10 text-center text-sm text-muted">대기 중 초대가 없습니다.</div>
      ) : (
        invites.map((invite) => (
          <div key={invite.id} className="grid grid-cols-[1.5fr,1fr,1.2fr,1fr,1fr] items-center gap-4 px-3 py-4">
            <div>
              <p className="font-semibold">{invite.email}</p>
              <p className="text-xs text-muted">{invite.name ?? "Awaiting details"}</p>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">{TEAM_ROLE_LABELS[invite.role]}</span>
            <p className="text-sm text-muted">{invite.invitedByName}</p>
            <p className="text-sm text-muted">{new Date(invite.invitedAt).toLocaleDateString()}</p>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold uppercase text-amber-200">
                {invite.status}
              </span>
              <button
                type="button"
                className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:bg-accent hover:text-foreground"
              >
                Resend
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
