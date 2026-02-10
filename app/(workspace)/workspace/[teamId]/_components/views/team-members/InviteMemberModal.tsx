// app/(workspace)/workspace/[teamId]/_components/views/team-members/InviteMemberModal.tsx
'use client';

import clsx from "clsx";
import { UserPlus, X } from "lucide-react";

import {
  TEAM_INVITE_ROLES,
  TEAM_ROLE_LABELS,
} from "@/app/(workspace)/workspace/[teamId]/_model/view.constants";
import type { MemberRole } from "@/workspace/members/_model/types";

type InviteMemberModalProps = {
  open: boolean;
  email: string;
  role: MemberRole;
  message: string;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: MemberRole) => void;
  onMessageChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export default function InviteMemberModal({
  open,
  email,
  role,
  message,
  onEmailChange,
  onRoleChange,
  onMessageChange,
  onClose,
  onSubmit,
  disabled,
}: InviteMemberModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="w-full max-w-lg rounded-[28px] border border-border bg-panel p-6 text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffd89c] to-[#f7ae57] text-[#1d1300]">
              <UserPlus size={20} />
            </span>
            <div>
              <p className="text-lg font-semibold">팀 멤버 초대</p>
              <p className="text-xs uppercase tracking-[0.4em] text-muted">Team management</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full border border-border p-2 text-muted transition hover:bg-accent hover:text-foreground"
            onClick={onClose}
            aria-label="Close invite modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.4em] text-muted">이메일</label>
            <div className="rounded-2xl border border-border bg-panel px-4 py-3">
              <input
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="team@fourier.app"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.4em] text-muted">역할</label>
            <div className="flex flex-wrap gap-1 rounded-full border border-border bg-panel/80 p-1">
              {TEAM_INVITE_ROLES.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={clsx(
                    "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition",
                    option === role ? "bg-accent text-foreground" : "text-muted hover:text-foreground"
                  )}
                  onClick={() => onRoleChange(option)}
                >
                  {TEAM_ROLE_LABELS[option]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.4em] text-muted">메시지</label>
            <div className="rounded-2xl border border-border bg-panel px-4 py-3">
              <input
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder="초대 메시지를 입력하세요"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={!email.trim() || disabled}
            className="w-full rounded-full bg-[#f7ce9c] px-4 py-2 text-sm font-semibold text-[#1a1203] transition disabled:opacity-40"
            onClick={onSubmit}
          >
            초대 보내기
          </button>
        </div>
      </div>
    </div>
  );
}
