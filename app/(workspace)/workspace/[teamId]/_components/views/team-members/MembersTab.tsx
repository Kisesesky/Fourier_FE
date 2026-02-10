// app/(workspace)/workspace/[teamId]/_components/views/team-members/MembersTab.tsx
'use client';

import clsx from "clsx";
import { ChevronDown, Pencil } from "lucide-react";

import {
  TEAM_INVITE_ROLES,
  TEAM_MEMBER_STATUS_COLOR,
  TEAM_ROLE_LABELS,
} from "@/app/(workspace)/workspace/[teamId]/_model/view.constants";
import { getInitials } from "@/app/(workspace)/workspace/[teamId]/_model/view.utils";
import type { TeamMembersTabContentProps } from "./team-members.types";

export default function MembersTab({
  filteredMembers,
  presenceMap,
  profileId,
  isAdmin,
  currentMemberRole,
  customRoles,
  onStartNicknameEdit,
  onRoleChange,
  onRemoveMember,
}: TeamMembersTabContentProps) {
  return (
    <div className="divide-y divide-border">
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] px-3 pb-3 text-[11px] uppercase tracking-[0.4em] text-muted">
        <span>Member</span>
        <span>Role</span>
        <span>Status</span>
      </div>
      {filteredMembers.length === 0 ? (
        <div className="px-3 py-10 text-center text-sm text-muted">일치하는 멤버가 없습니다.</div>
      ) : (
        filteredMembers.map((member) => {
          const presence = presenceMap[member.id];
          const presenceStatus = presence?.status ?? "offline";
          const displayName = member.nickname ?? member.displayName ?? member.name;
          const username = member.username ?? member.name;
          const showUsername = username && username !== displayName;
          const canEditNickname = member.id === profileId || isAdmin;
          const effectiveAvatar = member.teamAvatarUrl ?? member.avatarUrl;
          return (
            <div
              key={member.id}
              className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] items-center gap-2 px-3 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#3a3550] to-[#141826] text-sm font-semibold">
                  {effectiveAvatar ? (
                    <img src={effectiveAvatar} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    getInitials(member.name)
                  )}
                </span>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate font-semibold text-foreground">{displayName}</p>
                    {showUsername && (
                      <span className="truncate text-[11px] text-muted">({username})</span>
                    )}
                    {canEditNickname && (
                      <button
                        type="button"
                        className="rounded-full border border-transparent p-1 text-muted hover:border-border hover:text-foreground"
                        onClick={() => onStartNicknameEdit(member)}
                        aria-label="Edit nickname"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted">{member.email}</p>
                  {(member.location || member.timezone) && (
                    <p className="truncate text-[11px] text-muted/80">{member.location ?? member.timezone}</p>
                  )}
                </div>
              </div>
              {isAdmin && member.id !== profileId && member.role !== "owner" ? (
                <div className="relative w-24">
                  <select
                    value={member.customRoleId ? `custom:${member.customRoleId}` : member.role}
                    onChange={(e) => onRoleChange(member.id, e.target.value)}
                    className="w-full appearance-none rounded-full border border-border bg-panel px-3 py-1 pr-7 text-center text-[11px] text-foreground"
                  >
                    {(currentMemberRole === "manager"
                      ? TEAM_INVITE_ROLES.filter((role) => role !== "manager")
                      : TEAM_INVITE_ROLES
                    ).map((role) => (
                      <option key={role} value={role}>
                        {TEAM_ROLE_LABELS[role]}
                      </option>
                    ))}
                    {customRoles.map((role) => (
                      <option key={role.id} value={`custom:${role.id}`}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted"
                  />
                </div>
              ) : (
                <span className="inline-flex w-24 items-center justify-center rounded-full border border-border px-3 py-1 text-[11px] text-muted">
                  {member.customRoleName ?? TEAM_ROLE_LABELS[member.role]}
                </span>
              )}
              <div className="flex min-w-0 items-center gap-2 text-sm text-muted">
                <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold uppercase", TEAM_MEMBER_STATUS_COLOR[presenceStatus])}>
                  {presenceStatus}
                </span>
                {isAdmin && member.id !== profileId && member.role !== "owner" && (
                  <button
                    type="button"
                    className="whitespace-nowrap rounded-full border border-rose-300/40 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-rose-300 transition hover:bg-rose-500/10"
                    onClick={() => onRemoveMember(member.id, displayName)}
                    aria-label="Remove member"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
