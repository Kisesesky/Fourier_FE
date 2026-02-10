// app/(workspace)/workspace/[teamId]/_components/views/TeamMembersView.tsx
'use client';

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { CheckCircle, Search } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  MAX_TEAM_NICKNAME_LENGTH,
  TEAM_PERMISSION_OPTIONS,
} from "../../_model/view.constants";
import { mapTeamRole } from "../../_model/view.utils";
import {
  createCustomTeamRole,
  deleteCustomTeamRole,
  fetchCustomTeamRoles,
  updateCustomTeamRole,
  fetchTeamInvites,
  fetchTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  updateTeamMemberNickname,
  updateTeamMemberAvatar,
  updateTeamMemberCustomRole,
  updateTeamMemberRole,
} from "@/lib/team";
import { useToast } from "@/components/ui/Toast";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import type { Member, MemberRole, PresenceStatus } from "@/workspace/members/_model/types";
import Modal from "@/components/common/Modal";
import InviteMemberModal from "./team-members/InviteMemberModal";
import { TEAM_MEMBER_TABS } from "./team-members/team-members.constants";
import MembersTab from "./team-members/MembersTab";
import PendingInvitesTab from "./team-members/PendingInvitesTab";
import RolesTab from "./team-members/RolesTab";
import type { TeamCustomRole, TeamMembersTab, TeamPendingInvite } from "./team-members/team-members.types";

type TeamMembersViewProps = {
  teamId?: string;
};

const TeamMembersView = ({ teamId }: TeamMembersViewProps) => {
  const { workspace } = useWorkspace();
  const { show } = useToast();
  const { profile } = useAuthProfile();
  const [activeMemberTab, setActiveMemberTab] = useState<TeamMembersTab>("Members");
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("member");
  const [inviteMessage, setInviteMessage] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [avatarDraft, setAvatarDraft] = useState("");
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [customRoles, setCustomRoles] = useState<TeamCustomRole[]>([]);
  const [customRoleModalOpen, setCustomRoleModalOpen] = useState(false);
  const [customRoleEditingId, setCustomRoleEditingId] = useState<string | null>(null);
  const [customRoleName, setCustomRoleName] = useState("");
  const [customRoleDescription, setCustomRoleDescription] = useState("");
  const [customRolePermissions, setCustomRolePermissions] = useState<string[]>([]);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [pendingInvites, setPendingInvites] = useState<TeamPendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const editingMember = members.find((member) => member.id === editingMemberId) ?? null;
  const currentMember = members.find((member) => member.id === profile?.id);
  const isAdmin = currentMember?.role === "owner" || currentMember?.role === "manager";

  useEffect(() => {
    if (!workspace?.id || !teamId) return;
    const load = async () => {
      try {
        const data = await fetchTeamMembers(workspace.id, teamId);
        const mapped = (data ?? []).map((member: {
          userId: string;
          name: string;
          displayName?: string | null;
          nickname?: string | null;
          role: string;
          email?: string | null;
          avatarUrl?: string | null;
          teamAvatarUrl?: string | null;
          customRoleId?: string | null;
          customRoleName?: string | null;
        }) => ({
          id: member.userId,
          name: member.nickname ?? member.displayName ?? member.name ?? member.email ?? "User",
          displayName: member.displayName ?? member.name ?? member.email ?? "User",
          username: member.name ?? "",
          nickname: member.nickname ?? null,
          email: member.email ?? "",
          role: mapTeamRole(member.role),
          avatarUrl: member.avatarUrl ?? undefined,
          teamAvatarUrl: member.teamAvatarUrl ?? null,
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

  const startNicknameEdit = (member: Member) => {
    setEditingMemberId(member.id);
    setNicknameDraft(member.nickname ?? "");
    setAvatarDraft(member.teamAvatarUrl ?? "");
  };

  const cancelNicknameEdit = () => {
    setEditingMemberId(null);
    setNicknameDraft("");
    setAvatarDraft("");
  };

  const saveNickname = async (member: Member) => {
    if (!workspace?.id || !teamId) return;
    try {
      setNicknameSaving(true);
      const trimmed = nicknameDraft.trim();
      const avatarTrimmed = avatarDraft.trim();
      await Promise.all([
        updateTeamMemberNickname(workspace.id, teamId, member.id, trimmed.length ? trimmed : null),
        updateTeamMemberAvatar(workspace.id, teamId, member.id, avatarTrimmed.length ? avatarTrimmed : null),
      ]);
      setMembers((prev) =>
        prev.map((item) =>
          item.id === member.id
            ? {
                ...item,
                nickname: trimmed.length ? trimmed : null,
                name: trimmed.length ? trimmed : item.displayName ?? item.name,
                teamAvatarUrl: avatarTrimmed.length ? avatarTrimmed : null,
              }
            : item
        )
      );
      cancelNicknameEdit();
    } catch (err) {
      console.error("Failed to update nickname", err);
      show({
        title: "닉네임 변경 실패",
        description: "닉네임을 업데이트하지 못했습니다.",
        variant: "error",
      });
    } finally {
      setNicknameSaving(false);
    }
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

  const handleEditCustomRole = (role: TeamCustomRole) => {
    setCustomRoleEditingId(role.id);
    setCustomRoleName(role.name);
    setCustomRoleDescription(role.description ?? "");
    setCustomRolePermissions(role.permissions ?? []);
    setCustomRoleModalOpen(true);
  };

  const handleDeleteCustomRole = async (roleId: string) => {
    try {
      await deleteCustomTeamRole(workspace?.id ?? "", teamId ?? "", roleId);
      setCustomRoles((prev) => prev.filter((item) => item.id !== roleId));
    } catch (err) {
      console.error("Failed to delete custom role", err);
      show({
        title: "삭제 실패",
        description: "역할 삭제에 실패했습니다.",
        variant: "error",
      });
    }
  };

  const handleOpenCreateCustomRole = () => {
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
  };

  const tabContent: Record<TeamMembersTab, JSX.Element> = {
    Members: (
      <MembersTab
        filteredMembers={filteredMembers}
        presenceMap={presenceMap}
        profileId={profile?.id}
        isAdmin={isAdmin}
        currentMemberRole={currentMember?.role}
        customRoles={customRoles}
        onStartNicknameEdit={startNicknameEdit}
        onRoleChange={handleRoleChange}
        onRemoveMember={handleRemoveMember}
      />
    ),
    "Pending Invites": <PendingInvitesTab loading={loadingInvites} invites={pendingInvites} />,
    Roles: (
      <RolesTab
        customRoles={customRoles}
        isAdmin={isAdmin}
        onEditCustomRole={handleEditCustomRole}
        onDeleteCustomRole={handleDeleteCustomRole}
        onCreateCustomRole={handleOpenCreateCustomRole}
      />
    ),
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
            {TEAM_MEMBER_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={clsx(
                  "rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em]",
                  activeMemberTab === tab
                    ? "bg-foreground text-background"
                    : "border border-border text-muted hover:text-foreground"
                )}
                onClick={() => setActiveMemberTab(tab)}
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
              {TEAM_PERMISSION_OPTIONS.map((perm) => {
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

      <Modal
        open={!!editingMember}
        title="프로필 변경"
        onClose={cancelNicknameEdit}
        widthClass="max-w-[640px]"
      >
        <div className="space-y-4 px-4 pb-4 pt-2 text-sm">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.3em] text-muted">현재 표시 이름</div>
            <div className="text-sm font-semibold text-foreground">
              {nicknameDraft.trim() || editingMember?.displayName || editingMember?.name}
              {editingMember?.username && editingMember.username !== (editingMember.displayName ?? editingMember.name)
                ? ` (${editingMember.username})`
                : ""}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-muted">팀 닉네임</label>
            <input
              value={nicknameDraft}
              onChange={(e) => setNicknameDraft(e.target.value)}
              placeholder={editingMember?.displayName ?? "닉네임을 입력하세요"}
              maxLength={MAX_TEAM_NICKNAME_LENGTH}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none"
            />
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>최대 {MAX_TEAM_NICKNAME_LENGTH}자 · 비우면 기본 표시 이름으로 돌아갑니다.</span>
              <span>{nicknameDraft.trim().length}/{MAX_TEAM_NICKNAME_LENGTH}</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-muted">팀 아바타 URL</label>
            <div className="flex items-center gap-3">
              <div className="h-24 w-24 overflow-hidden rounded-2xl border border-border bg-panel">
                {avatarDraft.trim() ? (
                  <img src={avatarDraft.trim()} alt="Team avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">No</div>
                )}
              </div>
              <input
                value={avatarDraft}
                onChange={(e) => setAvatarDraft(e.target.value)}
                placeholder="https://..."
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-muted">
              비워두면 기본 아바타를 사용합니다.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-muted hover:bg-subtle/60"
              onClick={cancelNicknameEdit}
              disabled={nicknameSaving}
            >
              취소
            </button>
          <button
            type="button"
            className="rounded-full bg-foreground px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-background hover:bg-foreground/90"
            onClick={() => {
              if (editingMember) {
                void saveNickname(editingMember);
              }
            }}
            disabled={nicknameSaving || !editingMember}
          >
              저장
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default TeamMembersView;
