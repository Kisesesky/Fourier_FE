// app/(workspace)/workspace/[teamId]/_model/hooks/useTeamMembersViewController.ts
import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/components/ui/Toast";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import type { Member, MemberRole, PresenceStatus } from "@/workspace/members/_model/types";
import {
  changeTeamMemberCustomRole,
  changeTeamMemberRole,
  createTeamCustomRole,
  inviteToTeam,
  listTeamCustomRoles,
  listTeamMembers,
  listTeamPendingInvites,
  removeMemberFromTeam,
  removeTeamCustomRole,
  updateTeamCustomRole,
  updateTeamMemberProfile,
} from "../../_service/team-members.api";
import type { TeamCustomRole, TeamMembersTab, TeamPendingInvite } from "../types/team-members.types";

export function useTeamMembersViewController(teamId?: string) {
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
    listTeamMembers(workspace.id, teamId)
      .then(setMembers)
      .catch((error) => {
        console.error("Failed to fetch team members", error);
        show({
          title: "멤버 로딩 실패",
          description: "팀 멤버를 불러오지 못했습니다.",
          variant: "error",
        });
      });
  }, [teamId, workspace?.id, show]);

  useEffect(() => {
    if (!workspace?.id || !teamId || !isAdmin) return;
    listTeamCustomRoles(workspace.id, teamId)
      .then(setCustomRoles)
      .catch((error) => console.error("Failed to load custom roles", error));
  }, [workspace?.id, teamId, isAdmin]);

  useEffect(() => {
    if (!workspace?.id || !teamId || !isAdmin || activeMemberTab !== "Pending Invites") return;
    setLoadingInvites(true);
    listTeamPendingInvites(workspace.id, teamId)
      .then(setPendingInvites)
      .catch((error) => {
        console.error("Failed to fetch pending invites", error);
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

  const filteredMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return members;
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(normalizedSearch) ||
        member.email.toLowerCase().includes(normalizedSearch) ||
        (member.location ?? "").toLowerCase().includes(normalizedSearch),
    );
  }, [search, members]);

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
      show({ title: "권한이 필요합니다", description: "팀 관리자만 역할을 변경할 수 있습니다.", variant: "warning" });
      return;
    }
    if (memberId === profile?.id) {
      show({ title: "변경 불가", description: "본인의 역할은 변경할 수 없습니다.", variant: "warning" });
      return;
    }
    if (currentMember?.role === "manager" && nextRoleValue === "manager") {
      show({ title: "권한 제한", description: "관리자 승격은 생성자만 가능합니다.", variant: "warning" });
      return;
    }
    try {
      if (nextRoleValue.startsWith("custom:")) {
        const roleId = nextRoleValue.replace("custom:", "");
        const role = customRoles.find((item) => item.id === roleId);
        await changeTeamMemberCustomRole(workspace.id, teamId, memberId, roleId);
        setMembers((prev) =>
          prev.map((member) => (member.id === memberId ? { ...member, customRoleId: roleId, customRoleName: role?.name ?? "Custom Role" } : member)),
        );
      } else {
        const nextRole = nextRoleValue as MemberRole;
        await changeTeamMemberRole(workspace.id, teamId, memberId, nextRole.toUpperCase());
        setMembers((prev) =>
          prev.map((member) => (member.id === memberId ? { ...member, role: nextRole, customRoleId: null, customRoleName: null } : member)),
        );
      }
      show({ title: "역할 변경 완료", description: "멤버 역할이 업데이트되었습니다.", variant: "success" });
    } catch (error) {
      console.error("Failed to update member role", error);
      show({ title: "역할 변경 실패", description: "권한 또는 입력값을 확인해주세요.", variant: "error" });
    }
  };

  const handleInvite = async () => {
    if (!workspace?.id || !teamId) return false;
    if (!isAdmin) {
      show({ title: "권한이 필요합니다", description: "팀 관리자만 초대할 수 있습니다.", variant: "warning" });
      return false;
    }
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return false;
    try {
      await inviteToTeam(workspace.id, teamId, { email, role: inviteRole.toUpperCase(), message: inviteMessage.trim() || undefined });
      show({ title: "초대 완료", description: `${email} 로 팀 초대를 보냈습니다.`, variant: "success" });
      setInviteEmail("");
      setInviteMessage("");
      setInviteRole("member");
      setShowInviteModal(false);
      return true;
    } catch (error) {
      console.error("Failed to invite team member", error);
      show({ title: "초대 실패", description: "권한 또는 입력값을 확인해주세요.", variant: "error" });
      return false;
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!workspace?.id || !teamId) return;
    if (!isAdmin) {
      show({ title: "권한이 필요합니다", description: "팀 멤버를 삭제할 권한이 없습니다.", variant: "warning" });
      return;
    }
    if (memberId === profile?.id) {
      show({ title: "삭제 불가", description: "본인은 삭제할 수 없습니다.", variant: "warning" });
      return;
    }
    setRemoveTarget({ id: memberId, name });
  };

  const confirmRemoveMember = async () => {
    if (!removeTarget || !workspace?.id || !teamId) return;
    try {
      await removeMemberFromTeam(workspace.id, teamId, removeTarget.id);
      setMembers((prev) => prev.filter((member) => member.id !== removeTarget.id));
      show({ title: "멤버 삭제", description: `${removeTarget.name} 멤버가 삭제되었습니다.`, variant: "success" });
      setRemoveTarget(null);
    } catch (error) {
      console.error("Failed to remove member", error);
      show({ title: "멤버 삭제 실패", description: "권한 또는 상태를 확인해주세요.", variant: "error" });
    }
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
      await updateTeamMemberProfile(workspace.id, teamId, member.id, {
        nickname: trimmed.length ? trimmed : null,
        avatarUrl: avatarTrimmed.length ? avatarTrimmed : null,
      });
      setMembers((prev) =>
        prev.map((item) =>
          item.id === member.id
            ? {
                ...item,
                nickname: trimmed.length ? trimmed : null,
                name: trimmed.length ? trimmed : item.displayName ?? item.name,
                teamAvatarUrl: avatarTrimmed.length ? avatarTrimmed : null,
              }
            : item,
        ),
      );
      cancelNicknameEdit();
    } catch (error) {
      console.error("Failed to update nickname", error);
      show({ title: "닉네임 변경 실패", description: "닉네임을 업데이트하지 못했습니다.", variant: "error" });
    } finally {
      setNicknameSaving(false);
    }
  };

  const handleEditCustomRole = (role: TeamCustomRole) => {
    setCustomRoleEditingId(role.id);
    setCustomRoleName(role.name);
    setCustomRoleDescription(role.description ?? "");
    setCustomRolePermissions(role.permissions ?? []);
    setCustomRoleModalOpen(true);
  };

  const handleDeleteCustomRole = async (roleId: string) => {
    if (!workspace?.id || !teamId) return;
    try {
      await removeTeamCustomRole(workspace.id, teamId, roleId);
      setCustomRoles((prev) => prev.filter((item) => item.id !== roleId));
    } catch (error) {
      console.error("Failed to delete custom role", error);
      show({ title: "삭제 실패", description: "역할 삭제에 실패했습니다.", variant: "error" });
    }
  };

  const openCreateCustomRole = () => {
    setCustomRoleEditingId(null);
    setCustomRoleName("");
    setCustomRoleDescription("");
    setCustomRolePermissions([]);
    setCustomRoleModalOpen(true);
  };

  const closeCustomRoleModal = () => {
    setCustomRoleModalOpen(false);
    setCustomRoleEditingId(null);
    setCustomRoleName("");
    setCustomRoleDescription("");
    setCustomRolePermissions([]);
  };

  const submitCustomRole = async () => {
    if (!workspace?.id || !teamId) return;
    if (!customRoleName.trim()) {
      show({ title: "이름 필요", description: "역할 이름을 입력해주세요.", variant: "warning" });
      return;
    }
    try {
      if (customRoleEditingId) {
        const updated = await updateTeamCustomRole(workspace.id, teamId, customRoleEditingId, {
          name: customRoleName.trim(),
          description: customRoleDescription.trim(),
          permissions: customRolePermissions,
        });
        setCustomRoles((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await createTeamCustomRole(workspace.id, teamId, {
          name: customRoleName.trim(),
          description: customRoleDescription.trim(),
          permissions: customRolePermissions,
        });
        setCustomRoles((prev) => [created, ...prev]);
      }
      closeCustomRoleModal();
      show({
        title: customRoleEditingId ? "역할 수정" : "역할 생성",
        description: customRoleEditingId ? "커스텀 역할이 수정되었습니다." : "커스텀 역할이 추가되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to save custom role", error);
      show({
        title: customRoleEditingId ? "역할 수정 실패" : "역할 생성 실패",
        description: "권한 또는 입력값을 확인해주세요.",
        variant: "error",
      });
    }
  };

  return {
    workspace,
    profile,
    activeMemberTab,
    search,
    inviteEmail,
    inviteRole,
    inviteMessage,
    showInviteModal,
    members,
    editingMemberId,
    nicknameDraft,
    avatarDraft,
    nicknameSaving,
    customRoles,
    customRoleModalOpen,
    customRoleEditingId,
    customRoleName,
    customRoleDescription,
    customRolePermissions,
    removeTarget,
    pendingInvites,
    loadingInvites,
    editingMember,
    currentMember,
    isAdmin,
    presenceMap,
    filteredMembers,
    stats,
    setActiveMemberTab,
    setSearch,
    setInviteEmail,
    setInviteRole,
    setInviteMessage,
    setShowInviteModal,
    setNicknameDraft,
    setAvatarDraft,
    setCustomRoleName,
    setCustomRoleDescription,
    setCustomRolePermissions,
    setCustomRoleModalOpen,
    setRemoveTarget,
    handleRoleChange,
    handleInvite,
    handleRemoveMember,
    confirmRemoveMember,
    startNicknameEdit,
    cancelNicknameEdit,
    saveNickname,
    handleEditCustomRole,
    handleDeleteCustomRole,
    openCreateCustomRole,
    closeCustomRoleModal,
    submitCustomRole,
  };
}
