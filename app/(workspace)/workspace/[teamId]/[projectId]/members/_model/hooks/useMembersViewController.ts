// app/(workspace)/workspace/[teamId]/[projectId]/members/_model/hooks/useMembersViewController.ts
import { useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { useToast } from "@/components/ui/Toast";
import { useChat } from "@/workspace/chat/_model/store";
import { useMembersViewStore } from "@/workspace/members/_model/store/useMembersViewStore";
import { updateProfile } from "@/lib/auth";
import { loadUserPresence, saveUserPresence, USER_PRESENCE_EVENT, type UserPresenceStatus } from "@/lib/presence";
import { loadProfilePrefs, saveProfilePrefs, USER_PROFILE_PREFS_EVENT } from "@/lib/profile-prefs";
import type { Member, PresenceStatus } from "@/workspace/members/_model/types";
import {
  changeProjectMemberRole,
  getProjectName,
  inviteProjectMember,
  listProjectMembers,
  listTeamMembers,
  mapMemberRoleToProjectRole,
  removeMemberFromProject,
} from "@/workspace/members/_service/api";

const presenceOrder: Record<PresenceStatus, number> = {
  online: 0,
  dnd: 1,
  away: 2,
  offline: 3,
};

export function useMembersViewController() {
  const { teamId, projectId } = useParams<{ teamId: string; projectId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { buildHref } = useWorkspacePath();
  const { startGroupDM } = useChat();
  const { show } = useToast();
  const { workspace } = useWorkspace();
  const { profile } = useAuthProfile();
  const queryProfileAppliedRef = useRef<string | null>(null);

  const {
    members,
    setMembers,
    memberIds,
    setMemberIds,
    presence,
    setPresence,
    selectedMemberId,
    setSelectedMemberId,
    teamMembers,
    setTeamMembers,
    myPresence,
    setMyPresence,
    profilePrefs,
    setProfilePrefs,
    projectName,
    setProjectName,
    query,
    setQuery,
    inviteOpen,
    setInviteOpen,
    profileOpen,
    setProfileOpen,
    resetMembersViewState,
  } = useMembersViewStore();

  const loadMembers = async () => {
    if (!teamId || !projectId) return;
    try {
      const mapped = await listProjectMembers(teamId, projectId);
      const map = Object.fromEntries(mapped.map((member) => [member.id, member]));
      setMembers(map);
      setMemberIds(mapped.map((member) => member.id));
      if (!selectedMemberId && mapped[0]) {
        setSelectedMemberId(mapped[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch project members", error);
      show({
        title: "멤버 로딩 실패",
        description: "프로젝트 멤버를 불러오지 못했습니다.",
        variant: "error",
      });
    }
  };

  useEffect(() => {
    resetMembersViewState();
  }, [projectId, resetMembersViewState]);

  useEffect(() => {
    if (!teamId || !projectId) return;
    void loadMembers();
  }, [teamId, projectId, show]);

  useEffect(() => {
    if (!teamId || !projectId) return;
    getProjectName(teamId, projectId).then(setProjectName).catch(() => setProjectName(""));
  }, [projectId, teamId, setProjectName]);

  useEffect(() => {
    if (!workspace?.id || !teamId) return;
    listTeamMembers(workspace.id, teamId)
      .then(setTeamMembers)
      .catch((error) => console.error("Failed to fetch team members", error));
  }, [teamId, workspace?.id, setTeamMembers]);

  const normalizedQuery = query.trim().toLowerCase();
  const orderedMembers: Member[] = useMemo(() => {
    return memberIds
      .map((id) => members[id])
      .filter(Boolean)
      .filter((member) => {
        if (!normalizedQuery) return true;
        const fields = [
          member.name,
          member.email,
          member.role,
          member.title ?? "",
          member.tags?.join(" ") ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return fields.includes(normalizedQuery);
      })
      .sort((a, b) => {
        const presA = presence[a.id]?.status ?? "offline";
        const presB = presence[b.id]?.status ?? "offline";
        if (presenceOrder[presA] !== presenceOrder[presB]) {
          return presenceOrder[presA] - presenceOrder[presB];
        }
        if (!!a.isFavorite !== !!b.isFavorite) {
          return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
        }
        return a.name.localeCompare(b.name);
      });
  }, [memberIds, members, normalizedQuery, presence]);

  useEffect(() => {
    if (!selectedMemberId && orderedMembers[0]) {
      setSelectedMemberId(orderedMembers[0].id);
    }
  }, [orderedMembers, selectedMemberId, setSelectedMemberId]);

  useEffect(() => {
    const memberIdFromQuery = searchParams.get("memberId");
    const shouldOpenProfile = searchParams.get("profile") === "open";
    if (!memberIdFromQuery || !shouldOpenProfile) return;
    if (!members[memberIdFromQuery]) return;
    if (queryProfileAppliedRef.current === memberIdFromQuery) return;
    setSelectedMemberId(memberIdFromQuery);
    setProfileOpen(true);
    queryProfileAppliedRef.current = memberIdFromQuery;
  }, [members, searchParams, setProfileOpen, setSelectedMemberId]);

  useEffect(() => {
    setMyPresence(loadUserPresence());
    const onPresence = (event: Event) => {
      const detail = (event as CustomEvent<{ status?: UserPresenceStatus }>).detail;
      const next = detail?.status;
      if (next === "online" || next === "offline" || next === "away" || next === "dnd") {
        setMyPresence(next);
      } else {
        setMyPresence(loadUserPresence());
      }
    };
    window.addEventListener(USER_PRESENCE_EVENT, onPresence as EventListener);
    return () => window.removeEventListener(USER_PRESENCE_EVENT, onPresence as EventListener);
  }, [setMyPresence]);

  useEffect(() => {
    setProfilePrefs(loadProfilePrefs());
    const onProfilePrefs = () => setProfilePrefs(loadProfilePrefs());
    window.addEventListener(USER_PROFILE_PREFS_EVENT, onProfilePrefs);
    return () => window.removeEventListener(USER_PROFILE_PREFS_EVENT, onProfilePrefs);
  }, [setProfilePrefs]);

  useEffect(() => {
    if (!profile?.id) return;
    setMembers((prev) => {
      if (!prev[profile.id]) return prev;
      return {
        ...prev,
        [profile.id]: {
          ...prev[profile.id],
          name: profilePrefs.displayName || profile.displayName || profile.name || prev[profile.id].name,
          displayName: profilePrefs.displayName || profile.displayName || profile.name || prev[profile.id].displayName,
          avatarUrl: profilePrefs.avatarUrl || profile.avatarUrl || prev[profile.id].avatarUrl,
          backgroundImageUrl: profilePrefs.backgroundImageUrl || profile.backgroundImageUrl || prev[profile.id].backgroundImageUrl,
        },
      };
    });
  }, [profile?.avatarUrl, profile?.backgroundImageUrl, profile?.displayName, profile?.id, profile?.name, profilePrefs, setMembers]);

  useEffect(() => {
    if (memberIds.length === 0) {
      setPresence({});
      return;
    }
    const now = Date.now();
    setPresence((prev) => {
      const next: Record<string, { memberId: string; status: PresenceStatus; lastSeenAt: number }> = {};
      memberIds.forEach((id) => {
        const prevRecord = prev[id];
        const isCurrentUser = profile?.id === id;
        next[id] = {
          memberId: id,
          status: isCurrentUser ? myPresence : prevRecord?.status ?? "offline",
          lastSeenAt: isCurrentUser ? now : prevRecord?.lastSeenAt ?? now,
        };
      });
      return next;
    });
  }, [memberIds, myPresence, profile?.id, setPresence]);

  const selectedMember =
    selectedMemberId && profile?.id === selectedMemberId
      ? {
          ...(members[selectedMemberId] ?? {
            id: profile.id,
            name: profile.displayName ?? profile.name ?? profile.email ?? "Me",
            role: "member" as const,
            email: profile.email ?? "",
            joinedAt: Date.now(),
            lastActiveAt: Date.now(),
          }),
          name: profilePrefs.displayName || members[selectedMemberId]?.name || profile.displayName || profile.name || profile.email || "Me",
          displayName: profilePrefs.displayName || members[selectedMemberId]?.displayName || profile.displayName || profile.name || profile.email || "Me",
          avatarUrl: profilePrefs.avatarUrl || members[selectedMemberId]?.avatarUrl || profile.avatarUrl || undefined,
          backgroundImageUrl: profilePrefs.backgroundImageUrl || members[selectedMemberId]?.backgroundImageUrl || profile.backgroundImageUrl || undefined,
          description: members[selectedMemberId]?.description || profile.bio || undefined,
        }
      : selectedMemberId
        ? members[selectedMemberId] ?? null
        : null;

  const availableTeamMembers = useMemo(
    () => teamMembers.filter((member) => !members[member.id]),
    [teamMembers, members],
  );

  const myProjectRole = profile?.id ? members[profile.id]?.role : undefined;
  const canManageProjectRoles = myProjectRole === "owner";
  const total = orderedMembers.length;
  const online = orderedMembers.filter((member) => (presence[member.id]?.status ?? "offline") === "online").length;

  const updateMyPresence = (memberId: string, status: PresenceStatus) => {
    setMyPresence(status);
    saveUserPresence(status);
    setPresence((prev) => ({
      ...prev,
      [memberId]: {
        memberId,
        status,
        lastSeenAt: Date.now(),
      },
    }));
  };

  const handleInvite = async (payload: { userId: string; role: Member["role"] }) => {
    if (!teamId || !projectId) return;
    try {
      await inviteProjectMember(teamId, projectId, {
        userId: payload.userId,
        role: mapMemberRoleToProjectRole(payload.role ?? "member"),
      });
      await loadMembers();
      show({
        title: "멤버 추가 완료",
        description: "프로젝트 멤버가 추가되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to add project member", error);
      show({
        title: "멤버 추가 실패",
        description: "권한 또는 입력값을 확인해주세요.",
        variant: "error",
      });
    }
  };

  const handleSendDm = (memberId: string) => {
    if (!profile?.id || memberId === profile.id) return;
    const channelId = startGroupDM([memberId]);
    if (!channelId) return;
    router.push(buildHref(["chat", channelId], `/chat/${channelId}`));
  };

  const removeMember = async (memberId: string) => {
    if (!teamId || !projectId) return;
    try {
      await removeMemberFromProject(teamId, projectId, memberId);
      setMembers((prev) => {
        const next = { ...prev };
        delete next[memberId];
        return next;
      });
      setMemberIds((prev) => prev.filter((id) => id !== memberId));
      show({
        title: "멤버 삭제 완료",
        description: "프로젝트 멤버가 삭제되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to remove project member", error);
      show({
        title: "멤버 삭제 실패",
        description: "권한 또는 입력값을 확인해주세요.",
        variant: "error",
      });
      throw error;
    }
  };

  const handleRoleChange = async (memberId: string, role: Member["role"], memberName: string) => {
    if (!teamId || !projectId) return;
    try {
      await changeProjectMemberRole(teamId, projectId, {
        userId: memberId,
        role: mapMemberRoleToProjectRole(role),
      });
      setMembers((prev) => ({
        ...prev,
        [memberId]: {
          ...prev[memberId],
          role,
        },
      }));
      show({
        title: "권한 변경 완료",
        description: `${memberName} 권한이 변경되었습니다.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to update project member role", error);
      show({
        title: "권한 변경 실패",
        description: "권한 또는 입력값을 확인해주세요.",
        variant: "error",
      });
      throw error;
    }
  };

  const handleProfileSave = async (memberId: string, patch: {
    displayName?: string;
    avatarUrl?: string | null;
    backgroundImageUrl?: string | null;
    bio?: string;
  }) => {
    if (!selectedMember || memberId !== profile?.id) return;
    if (
      patch.displayName?.trim() !== undefined ||
      patch.avatarUrl !== undefined ||
      patch.backgroundImageUrl !== undefined ||
      patch.bio !== undefined
    ) {
      try {
        await updateProfile({
          displayName: patch.displayName?.trim(),
          backgroundImageUrl: patch.backgroundImageUrl?.trim() ?? "",
          bio: patch.bio,
        });
      } catch {
        // local sync fallback
      }
    }
    saveProfilePrefs({
      displayName: patch.displayName?.trim() ?? (profilePrefs.displayName || selectedMember.name),
      avatarUrl: patch.avatarUrl ?? profilePrefs.avatarUrl,
      backgroundImageUrl: patch.backgroundImageUrl ?? profilePrefs.backgroundImageUrl,
    });
    setMembers((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        name: patch.displayName?.trim() || prev[memberId]?.name || selectedMember.name,
        displayName: patch.displayName?.trim() || prev[memberId]?.displayName || selectedMember.displayName,
        avatarUrl: patch.avatarUrl ?? prev[memberId]?.avatarUrl,
        backgroundImageUrl: patch.backgroundImageUrl ?? prev[memberId]?.backgroundImageUrl,
        description: patch.bio ?? prev[memberId]?.description,
      },
    }));
    setProfileOpen(false);
  };

  return {
    teamId,
    projectId,
    profile,
    members,
    memberIds,
    presence,
    selectedMember,
    orderedMembers,
    availableTeamMembers,
    canManageProjectRoles,
    query,
    inviteOpen,
    profileOpen,
    projectName,
    total,
    online,
    setQuery,
    setInviteOpen,
    setProfileOpen,
    setSelectedMemberId,
    setPresence,
    setMyPresence,
    setMembers,
    setMemberIds,
    handleInvite,
    handleSendDm,
    removeMember,
    handleRoleChange,
    handleProfileSave,
    updateMyPresence,
  };
}
