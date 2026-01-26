'use client';

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { CheckCircle, Search, UserPlus, X } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  createCustomTeamRole,
  deleteCustomTeamRole,
  fetchCustomTeamRoles,
  updateCustomTeamRole,
  fetchTeamInvites,
  fetchTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  updateTeamMemberCustomRole,
  updateTeamMemberRole,
} from "@/lib/team";
import { useToast } from "@/components/ui/Toast";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import type { Member, MemberRole, PresenceStatus } from "@/workspace/members/_model/types";
import Modal from "@/components/common/Modal";

const roleLabels: Record<MemberRole, string> = {
  owner: "생성자",
  manager: "관리자",
  member: "편집자",
  guest: "뷰어",
};

const displayRoles: MemberRole[] = ["owner", "manager", "member", "guest"];
const inviteRoles: MemberRole[] = ["manager", "member", "guest"];
const permissionOptions = [
  { id: "TEAM_INVITE_MEMBER", label: "팀 멤버 초대/삭제" },
  { id: "TEAM_UPDATE_ROLE", label: "팀 멤버 역할 변경" },
  { id: "TEAM_SETTINGS_UPDATE", label: "팀 설정 변경" },
  { id: "PROJECT_CREATE_DELETE", label: "프로젝트 생성/삭제" },
  { id: "PROJECT_INVITE_MEMBER", label: "프로젝트 멤버 초대/삭제" },
  { id: "PROJECT_UPDATE_ROLE", label: "프로젝트 멤버 역할 변경" },
];

const defaultRoleDescriptions: Record<MemberRole, string> = {
  owner: "워크스페이스/팀 전반을 모두 관리합니다.",
  manager: "팀 운영 및 프로젝트 관리를 담당합니다.",
  member: "프로젝트 작업을 생성/수정합니다.",
  guest: "읽기와 댓글 중심으로 참여합니다.",
};

const defaultRolePermissions: Record<MemberRole, string[]> = {
  owner: permissionOptions.map((item) => item.label),
  manager: permissionOptions.map((item) => item.label),
  member: [
    "프로젝트 생성/삭제",
    "프로젝트 멤버 초대/삭제",
  ],
  guest: ["읽기/댓글"],
};

const statusColor: Record<PresenceStatus, string> = {
  online: "bg-emerald-400/10 text-emerald-300",
  away: "bg-amber-400/10 text-amber-200",
  offline: "bg-slate-500/15 text-muted",
  dnd: "bg-rose-500/15 text-rose-300",
};

const mapTeamRole = (role: string): MemberRole => {
  switch (role) {
    case "OWNER":
      return "owner";
    case "ADMIN":
    case "MANAGER":
      return "manager";
    case "MEMBER":
      return "member";
    case "GUEST":
      return "guest";
    default:
      return "member";
  }
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

interface InviteMemberModalProps {
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
}

const InviteMemberModal = ({
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
}: InviteMemberModalProps) => {
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
            <div className="flex flex-wrap gap-2">
              {inviteRoles.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={clsx(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em]",
                    option === role
                      ? "border-primary bg-accent text-foreground"
                      : "border-border text-muted hover:bg-accent hover:text-foreground"
                  )}
                  onClick={() => onRoleChange(option)}
                >
                  {roleLabels[option]}
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
};

type TeamMembersViewProps = {
  teamId?: string;
};

const TeamMembersView = ({ teamId }: TeamMembersViewProps) => {
  const { workspace } = useWorkspace();
  const { show } = useToast();
  const { profile } = useAuthProfile();
  const [activeMemberTab, setActiveMemberTab] = useState<"Members" | "Pending Invites" | "Roles">("Members");
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("member");
  const [inviteMessage, setInviteMessage] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [customRoles, setCustomRoles] = useState<Array<{ id: string; name: string; description?: string | null; permissions: string[] }>>([]);
  const [customRoleModalOpen, setCustomRoleModalOpen] = useState(false);
  const [customRoleEditingId, setCustomRoleEditingId] = useState<string | null>(null);
  const [customRoleName, setCustomRoleName] = useState("");
  const [customRoleDescription, setCustomRoleDescription] = useState("");
  const [customRolePermissions, setCustomRolePermissions] = useState<string[]>([]);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [pendingInvites, setPendingInvites] = useState<Array<{
    id: string;
    email: string;
    role: MemberRole;
    invitedByName: string;
    invitedAt: number;
    status: string;
    name?: string;
    message?: string;
  }>>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const currentMember = members.find((member) => member.id === profile?.id);
  const isOwner = currentMember?.role === "owner";
  const isAdmin = currentMember?.role === "owner" || currentMember?.role === "manager";

  useEffect(() => {
    if (!workspace?.id || !teamId) return;
    const load = async () => {
      try {
        const data = await fetchTeamMembers(workspace.id, teamId);
        const mapped = (data ?? []).map((member: {
          userId: string;
          name: string;
          role: string;
          email?: string | null;
          avatarUrl?: string | null;
          customRoleId?: string | null;
          customRoleName?: string | null;
        }) => ({
          id: member.userId,
          name: member.name,
          email: member.email ?? "",
          role: mapTeamRole(member.role),
          avatarUrl: member.avatarUrl ?? undefined,
          customRoleId: member.customRoleId ?? null,
          customRoleName: member.customRoleName ?? null,
          joinedAt: Date.now(),
          lastActiveAt: Date.now(),
        }));
        setMembers(mapped);
      } catch (err) {
        console.error("Failed to fetch team members", err);
        show({
          title: "멤버 로딩 실패",
          description: "팀 멤버를 불러오지 못했습니다.",
          variant: "error",
        });
      }
    };
    load();
  }, [teamId, workspace?.id, show]);

  useEffect(() => {
    if (!workspace?.id || !teamId || !isAdmin) return;
    fetchCustomTeamRoles(workspace.id, teamId)
      .then((data) => setCustomRoles(data ?? []))
      .catch((err) => console.error("Failed to load custom roles", err));
  }, [workspace?.id, teamId, isAdmin]);

  useEffect(() => {
    if (!workspace?.id || !teamId || !isAdmin) return;
    if (activeMemberTab !== "Pending Invites") return;
    setLoadingInvites(true);
    fetchTeamInvites(workspace.id, teamId)
      .then((data) => {
        const mapped = (data ?? []).map((invite) => ({
          id: invite.id,
          email: invite.email,
          role: mapTeamRole(invite.role),
          invitedByName: invite.invitedByName,
          invitedAt: new Date(invite.invitedAt).getTime(),
          status: invite.status,
          name: invite.name,
          message: invite.message,
        }));
        setPendingInvites(mapped);
      })
      .catch((err) => {
        console.error("Failed to fetch pending invites", err);
        show({
          title: "초대 목록 로딩 실패",
          description: "대기 중 초대를 불러오지 못했습니다.",
          variant: "error",
        });
      })
      .finally(() => setLoadingInvites(false));
  }, [activeMemberTab, isAdmin, teamId, workspace?.id, show]);

  const presenceMap = useMemo(() => {
    const map: Record<string, { status: PresenceStatus }> = {};
    members.forEach((member) => {
      map[member.id] = { status: member.id === profile?.id ? "online" : "offline" };
    });
    return map;
  }, [members, profile?.id]);
  const onlineCount = 0;
  const favoriteCount = members.filter((member) => member.isFavorite).length;

  const stats = [
    { id: "total", label: "Team members", value: members.length, helper: `${onlineCount} online` },
    { id: "pending", label: "Pending invites", value: pendingInvites.length, helper: "Auto-expire in 7 days" },
    { id: "favorites", label: "Favorites", value: favoriteCount, helper: "Star from profile" },
  ];

  const handleRoleChange = async (memberId: string, nextRoleValue: string) => {
    if (!workspace?.id || !teamId) return;
    if (!isAdmin) {
      show({
        title: "권한이 필요합니다",
        description: "팀 관리자만 역할을 변경할 수 있습니다.",
        variant: "warning",
      });
      return;
    }
    if (memberId === profile?.id) {
      show({
        title: "변경 불가",
        description: "본인의 역할은 변경할 수 없습니다.",
        variant: "warning",
      });
      return;
    }
    if (currentMember?.role === "manager" && nextRoleValue === "manager") {
      show({
        title: "권한 제한",
        description: "관리자 승격은 생성자만 가능합니다.",
        variant: "warning",
      });
      return;
    }
    try {
      if (nextRoleValue.startsWith("custom:")) {
        const roleId = nextRoleValue.replace("custom:", "");
        const role = customRoles.find((item) => item.id === roleId);
        await updateTeamMemberCustomRole(workspace.id, teamId, memberId, roleId);
        setMembers((prev) =>
          prev.map((member) =>
            member.id === memberId
              ? {
                  ...member,
                  customRoleId: roleId,
                  customRoleName: role?.name ?? "Custom Role",
                }
              : member
          )
        );
      } else {
        const nextRole = nextRoleValue as MemberRole;
        await updateTeamMemberRole(workspace.id, teamId, memberId, nextRole.toUpperCase());
        setMembers((prev) =>
          prev.map((member) =>
            member.id === memberId
              ? { ...member, role: nextRole, customRoleId: null, customRoleName: null }
              : member
          )
        );
      }
      show({
        title: "역할 변경 완료",
        description: "멤버 역할이 업데이트되었습니다.",
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to update member role", err);
      show({
        title: "역할 변경 실패",
        description: "권한 또는 입력값을 확인해주세요.",
        variant: "error",
      });
    }
  };

  const handleInvite = async () => {
    if (!workspace?.id || !teamId) return;
    if (!isAdmin) {
      show({
        title: "권한이 필요합니다",
        description: "팀 관리자만 초대할 수 있습니다.",
        variant: "warning",
      });
      return;
    }
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    try {
      await inviteTeamMember(workspace.id, teamId, {
        email,
        role: inviteRole.toUpperCase(),
        message: inviteMessage.trim() || undefined,
      });
      show({
        title: "초대 완료",
        description: `${email} 로 팀 초대를 보냈습니다.`,
        variant: "success",
      });
      setInviteEmail("");
      setInviteMessage("");
      setInviteRole("member");
      setShowInviteModal(false);
    } catch (err) {
      console.error("Failed to invite team member", err);
      show({
        title: "초대 실패",
        description: "권한 또는 입력값을 확인해주세요.",
        variant: "error",
      });
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!workspace?.id || !teamId) return;
    if (!isAdmin) {
      show({
        title: "권한이 필요합니다",
        description: "팀 멤버를 삭제할 권한이 없습니다.",
        variant: "warning",
      });
      return;
    }
    if (memberId === profile?.id) {
      show({
        title: "삭제 불가",
        description: "본인은 삭제할 수 없습니다.",
        variant: "warning",
      });
      return;
    }
    setRemoveTarget({ id: memberId, name });
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredMembers = useMemo(() => {
    if (!normalizedSearch) return members;
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(normalizedSearch) ||
        member.email.toLowerCase().includes(normalizedSearch) ||
        (member.location ?? "").toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch, members]);

  const renderMembers = () => (
    <div className="divide-y divide-border">
      <div className="grid grid-cols-[1.6fr,1.4fr,1fr,1.2fr] px-3 pb-3 text-[11px] uppercase tracking-[0.4em] text-muted">
        <span>Member</span>
        <span>Email</span>
        <span>Role</span>
        <span>Status</span>
      </div>
      {filteredMembers.length === 0 ? (
        <div className="px-3 py-10 text-center text-sm text-muted">일치하는 멤버가 없습니다.</div>
      ) : (
        filteredMembers.map((member) => {
          const presence = presenceMap[member.id];
          const presenceStatus = presence?.status ?? "offline";
          return (
            <div key={member.id} className="grid grid-cols-[1.6fr,1.4fr,1fr,1.2fr] items-center gap-4 px-3 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#3a3550] to-[#141826] text-sm font-semibold">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    getInitials(member.name)
                  )}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{member.name}</p>
                  <p className="text-xs text-muted">{member.location ?? member.timezone ?? "—"}</p>
                </div>
              </div>
              <p className="font-mono text-sm text-foreground">{member.email}</p>
              {isAdmin && member.id !== profile?.id && member.role !== "owner" ? (
                <select
                  value={member.customRoleId ? `custom:${member.customRoleId}` : member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  className="w-36 rounded-full border border-border bg-panel px-3 py-1 text-center text-xs text-foreground"
                >
                  {(currentMember?.role === "manager"
                    ? inviteRoles.filter((role) => role !== "manager")
                    : inviteRoles
                  ).map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                  {customRoles.map((role) => (
                    <option key={role.id} value={`custom:${role.id}`}>
                      {role.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="w-36 rounded-full border border-border px-3 py-1 text-center text-xs text-muted">
                  {member.customRoleName ?? roleLabels[member.role]}
                </span>
              )}
              <div className="flex items-center gap-2 text-sm text-muted">
                <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold uppercase", statusColor[presenceStatus])}>
                  {presenceStatus}
                </span>
                {isAdmin && member.id !== profile?.id && member.role !== "owner" && (
                  <button
                    type="button"
                    className="rounded-full border border-rose-300/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-300 transition hover:bg-rose-500/10"
                    onClick={() => handleRemoveMember(member.id, member.name)}
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

  const renderPending = () => (
    <div className="divide-y divide-border">
      <div className="grid grid-cols-[1.5fr,1fr,1.2fr,1fr,1fr] px-3 pb-3 text-[11px] uppercase tracking-[0.4em] text-muted">
        <span>Email</span>
        <span>Role</span>
        <span>Invited By</span>
        <span>Invited At</span>
        <span>Status</span>
      </div>
      {loadingInvites ? (
        <div className="px-3 py-10 text-center text-sm text-muted">초대 목록을 불러오는 중...</div>
      ) : pendingInvites.length === 0 ? (
        <div className="px-3 py-10 text-center text-sm text-muted">대기 중 초대가 없습니다.</div>
      ) : (
        pendingInvites.map((invite) => (
        <div key={invite.id} className="grid grid-cols-[1.5fr,1fr,1.2fr,1fr,1fr] items-center gap-4 px-3 py-4">
          <div>
            <p className="font-semibold">{invite.email}</p>
            <p className="text-xs text-muted">{invite.name ?? "Awaiting details"}</p>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">{roleLabels[invite.role]}</span>
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
      )))
      }
    </div>
  );

  const renderRoles = () => (
    <div className="space-y-4">
      {displayRoles.map((role) => (
        <div key={role} className="rounded-2xl border border-border bg-panel p-5">
          <p className="text-lg font-semibold text-foreground">{roleLabels[role]}</p>
          <p className="mt-2 text-sm text-muted">{defaultRoleDescriptions[role]}</p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {defaultRolePermissions[role].map((perm) => (
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
                      onClick={() => {
                        setCustomRoleEditingId(role.id);
                        setCustomRoleName(role.name);
                        setCustomRoleDescription(role.description ?? "");
                        setCustomRolePermissions(role.permissions ?? []);
                        setCustomRoleModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-foreground bg-red-500 hover:text-muted"
                      onClick={async () => {
                        try {
                          await deleteCustomTeamRole(workspace?.id ?? "", teamId ?? "", role.id);
                          setCustomRoles((prev) => prev.filter((item) => item.id !== role.id));
                        } catch (err) {
                          console.error("Failed to delete custom role", err);
                          show({
                            title: "삭제 실패",
                            description: "역할 삭제에 실패했습니다.",
                            variant: "error",
                          });
                        }
                      }}
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
                    {permissionOptions.find((item) => item.id === perm)?.label ?? perm}
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
          onClick={() => {
            if (!isAdmin) return;
            if (customRoles.length >= 5) {
              show({
                title: "역할 제한",
                description: "커스텀 역할은 팀당 최대 5개까지 생성할 수 있습니다.",
                variant: "warning",
              });
              return;
            }
            setCustomRoleEditingId(null);
            setCustomRoleName("");
            setCustomRoleDescription("");
            setCustomRolePermissions([]);
            setCustomRoleModalOpen(true);
          }}
        >
          + Create Custom Role
        </button>
      </div>
    </div>
  );

  const tabContent: Record<typeof activeMemberTab, JSX.Element> = {
    Members: renderMembers(),
    "Pending Invites": renderPending(),
    Roles: renderRoles(),
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.id}
            className="rounded-[28px] border border-border bg-panel px-5 py-4 text-foreground shadow-[0_3px_10px_rgba(0,0,0,0.04)]"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-muted">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
            <p className="text-sm text-muted">{item.helper}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[32px] border border-border bg-panel p-6 text-foreground shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex flex-wrap gap-2">
            {["Members", "Pending Invites", "Roles"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={clsx(
                  "rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em]",
                  activeMemberTab === tab
                    ? "bg-foreground text-background"
                    : "border border-border text-muted hover:text-foreground"
                )}
                onClick={() => setActiveMemberTab(tab as typeof activeMemberTab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
              <Search size={14} className="text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search member"
                className="w-32 bg-transparent text-xs text-foreground placeholder:text-muted focus:w-48 focus:outline-none sm:w-48"
              />
            </div>
            <button
              type="button"
              className={clsx(
                "rounded-full bg-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] transition",
                isAdmin ? "hover:bg-accent/80" : "cursor-not-allowed opacity-50"
              )}
              onClick={() => {
                if (!isAdmin) {
                  show({
                    title: "권한이 필요합니다",
                    description: "팀 관리자만 초대할 수 있습니다.",
                    variant: "warning",
                  });
                  return;
                }
                setShowInviteModal(true);
              }}
            >
              팀 멤버 초대
            </button>
          </div>
        </div>
        <div className="pt-4">{tabContent[activeMemberTab]}</div>
      </div>

      <InviteMemberModal
        open={showInviteModal}
        email={inviteEmail}
        role={inviteRole}
        message={inviteMessage}
        onEmailChange={setInviteEmail}
        onRoleChange={setInviteRole}
        onMessageChange={setInviteMessage}
        onClose={() => setShowInviteModal(false)}
        onSubmit={async () => {
          await handleInvite();
          setShowInviteModal(false);
          setInviteEmail("");
          setInviteRole("member");
          setInviteMessage("");
        }}
        disabled={!isAdmin}
      />

      <Modal
        open={customRoleModalOpen}
        title={customRoleEditingId ? "커스텀 역할 수정" : "커스텀 역할 추가"}
        onClose={() => {
          setCustomRoleModalOpen(false);
          setCustomRoleEditingId(null);
          setCustomRoleName("");
          setCustomRoleDescription("");
          setCustomRolePermissions([]);
        }}
        widthClass="w-[560px]"
      >
        <div className="space-y-5 p-6 text-sm">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">역할 이름</label>
            <input
              value={customRoleName}
              onChange={(e) => setCustomRoleName(e.target.value)}
              placeholder="예: Content Moderator"
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">설명</label>
            <textarea
              placeholder="역할의 목적과 책임을 짧게 설명하세요."
              value={customRoleDescription}
              onChange={(e) => setCustomRoleDescription(e.target.value)}
              className="min-h-[80px] w-full resize-none rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">권한</label>
            <div className="space-y-2">
              {permissionOptions.map((perm) => {
                const checked = customRolePermissions.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    className={clsx(
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition",
                      checked ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" : "border-border text-muted hover:bg-accent"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setCustomRolePermissions((prev) =>
                          checked ? prev.filter((item) => item !== perm.id) : [...prev, perm.id]
                        );
                      }}
                    />
                    <CheckCircle size={14} className={checked ? "text-emerald-300" : "text-muted"} />
                    <span>{perm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-muted hover:bg-subtle/60"
              onClick={() => setCustomRoleModalOpen(false)}
            >
              취소
            </button>
            <button
              type="button"
              className="rounded-full bg-foreground px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-background hover:bg-foreground/90"
              onClick={async () => {
                if (!workspace?.id || !teamId) return;
                if (!customRoleName.trim()) {
                  show({
                    title: "이름 필요",
                    description: "역할 이름을 입력해주세요.",
                    variant: "warning",
                  });
                  return;
                }
                try {
                  if (customRoleEditingId) {
                    const updated = await updateCustomTeamRole(workspace.id, teamId, customRoleEditingId, {
                      name: customRoleName.trim(),
                      description: customRoleDescription.trim(),
                      permissions: customRolePermissions,
                    });
                    setCustomRoles((prev) =>
                      prev.map((item) => (item.id === updated.id ? updated : item))
                    );
                  } else {
                    const created = await createCustomTeamRole(workspace.id, teamId, {
                      name: customRoleName.trim(),
                      description: customRoleDescription.trim(),
                      permissions: customRolePermissions,
                    });
                    setCustomRoles((prev) => [created, ...prev]);
                  }
                  setCustomRoleName("");
                  setCustomRoleDescription("");
                  setCustomRolePermissions([]);
                  setCustomRoleEditingId(null);
                  setCustomRoleModalOpen(false);
                  show({
                    title: customRoleEditingId ? "역할 수정" : "역할 생성",
                    description: customRoleEditingId ? "커스텀 역할이 수정되었습니다." : "커스텀 역할이 추가되었습니다.",
                    variant: "success",
                  });
                } catch (err) {
                  console.error("Failed to create custom role", err);
                  show({
                    title: customRoleEditingId ? "역할 수정 실패" : "역할 생성 실패",
                    description: "권한 또는 입력값을 확인해주세요.",
                    variant: "error",
                  });
                }
              }}
            >
              {customRoleEditingId ? "저장" : "생성"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!removeTarget}
        title="팀 멤버 삭제"
        onClose={() => setRemoveTarget(null)}
        widthClass="w-[300px]"
      >
        <div className="space-y-2 px-3 pb-3 pt-2 text-xs">
          <p className="text-sm text-muted">
            {removeTarget?.name} 멤버를 팀에서 삭제할까요?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-border px-2.5 py-1 text-[10px] text-muted hover:bg-subtle/60"
              onClick={() => setRemoveTarget(null)}
            >
              취소
            </button>
            <button
              type="button"
              className="rounded-md bg-rose-500 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-rose-500/90"
              onClick={async () => {
                if (!removeTarget || !workspace?.id || !teamId) return;
                try {
                  await removeTeamMember(workspace.id, teamId, removeTarget.id);
                  setMembers((prev) => prev.filter((member) => member.id !== removeTarget.id));
                  show({
                    title: "멤버 삭제",
                    description: `${removeTarget.name} 멤버가 삭제되었습니다.`,
                    variant: "success",
                  });
                  setRemoveTarget(null);
                } catch (err) {
                  console.error("Failed to remove member", err);
                  show({
                    title: "멤버 삭제 실패",
                    description: "권한 또는 상태를 확인해주세요.",
                    variant: "error",
                  });
                }
              }}
            >
              삭제
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default TeamMembersView;
