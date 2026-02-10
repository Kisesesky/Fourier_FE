// app/(workspace)/workspace/[teamId]/_components/views/team-members/RolesTab.tsx
'use client';

import clsx from "clsx";
import { CheckCircle } from "lucide-react";

import {
  TEAM_DEFAULT_ROLE_DESCRIPTIONS,
  TEAM_DEFAULT_ROLE_PERMISSIONS,
  TEAM_DISPLAY_ROLES,
  TEAM_PERMISSION_OPTIONS,
  TEAM_ROLE_LABELS,
} from "@/app/(workspace)/workspace/[teamId]/_model/view.constants";
import type { TeamCustomRole } from "./team-members.types";

type RolesTabProps = {
  customRoles: TeamCustomRole[];
  isAdmin: boolean;
  onEditCustomRole: (role: TeamCustomRole) => void;
  onDeleteCustomRole: (roleId: string) => Promise<void>;
  onCreateCustomRole: () => void;
};

export default function RolesTab({
  customRoles,
  isAdmin,
  onEditCustomRole,
  onDeleteCustomRole,
  onCreateCustomRole,
}: RolesTabProps) {
  return (
    <div className="space-y-4">
      {TEAM_DISPLAY_ROLES.map((role) => (
        <div key={role} className="rounded-2xl border border-border bg-panel p-5">
          <p className="text-lg font-semibold text-foreground">{TEAM_ROLE_LABELS[role]}</p>
          <p className="mt-2 text-sm text-muted">{TEAM_DEFAULT_ROLE_DESCRIPTIONS[role]}</p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {TEAM_DEFAULT_ROLE_PERMISSIONS[role].map((perm) => (
              <li key={`${role}-${perm}`} className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400" />
                {perm}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="text-xs uppercase tracking-[0.3em] text-muted">Custom roles</div>
      {customRoles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-muted">
          커스텀 역할이 없습니다. 필요하면 새 역할을 추가하세요.
        </div>
      ) : (
        <div className="space-y-3">
          {customRoles.map((role) => (
            <div key={role.id} className="group rounded-2xl border border-border bg-panel p-5">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-foreground">{role.name}</p>
                {isAdmin && (
                  <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-foreground bg-green-500 hover:text-muted"
                      onClick={() => onEditCustomRole(role)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-foreground bg-red-500 hover:text-muted"
                      onClick={() => void onDeleteCustomRole(role.id)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-muted">
                {role.description?.trim() || "커스텀 권한으로 팀/프로젝트 관리 범위를 조정합니다."}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {role.permissions.map((perm) => (
                  <li key={`${role.id}-${perm}`} className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-400" />
                    {TEAM_PERMISSION_OPTIONS.find((item) => item.id === perm)?.label ?? perm}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          className={clsx(
            "w-full rounded-full border border-border py-4 text-sm text-muted font-semibold uppercase tracking-[0.3em] transition hover:bg-accent hover:text-foreground",
            !isAdmin && "cursor-not-allowed opacity-50"
          )}
          onClick={onCreateCustomRole}
        >
          + Create Custom Role
        </button>
      </div>
    </div>
  );
}
