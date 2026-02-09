// components/members/MembersView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, UserPlus, Users, X } from "lucide-react";
import MemberCard from "./MemberCard";
import MemberProfilePanel from "./MemberProfilePanel";
import InviteForm from "./InviteForm";
import { useParams, useRouter } from "next/navigation";
import { addProjectMember, fetchProjectMembers, fetchProjects, removeProjectMember, updateProjectMemberRole } from "@/lib/projects";
import { fetchTeamMembers } from "@/lib/team";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { useToast } from "@/components/ui/Toast";
import type { Member, PresenceStatus } from "@/workspace/members/_model/types";
import { loadUserPresence, saveUserPresence, USER_PRESENCE_EVENT, type UserPresenceStatus } from "@/lib/presence";
import { loadProfilePrefs, saveProfilePrefs, USER_PROFILE_PREFS_EVENT } from "@/lib/profile-prefs";
import { updateProfile } from "@/lib/auth";
import { useChat } from "@/workspace/chat/_model/store";

const presenceOrder: Record<PresenceStatus, number> = {
  online: 0,
  dnd: 1,
  away: 2,
  offline: 3,
};

const mapProjectRole = (role: string): Member["role"] => {
  switch (role) {
    case "OWNER":
      return "owner";
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

const mapMemberRoleToProjectRole = (role: Member["role"]) => {
  switch (role) {
    case "owner":
      return "OWNER";
    case "manager":
      return "MANAGER";
    case "member":
      return "MEMBER";
    case "guest":
      return "GUEST";
    default:
      return "MEMBER";
  }
};

export default function MembersView() {
  const { teamId, projectId } = useParams<{ teamId: string; projectId: string }>();
  const router = useRouter();
  const { buildHref } = useWorkspacePath();
  const { startGroupDM } = useChat();
  const { show } = useToast();
  const { workspace } = useWorkspace();
  const { profile } = useAuthProfile();
  const [members, setMembers] = useState<Record<string, Member>>({});
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [presence, setPresence] = useState<Record<string, { memberId: string; status: PresenceStatus; lastSeenAt: number }>>({});
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email?: string | null }>>([]);
  const [myPresence, setMyPresence] = useState<UserPresenceStatus>("online");
  const [profilePrefs, setProfilePrefs] = useState<{ displayName: string; avatarUrl: string; backgroundImageUrl: string }>({
    displayName: "",
    avatarUrl: "",
    backgroundImageUrl: "",
  });
  const [projectName, setProjectName] = useState("");

  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const loadMembers = async () => {
    if (!teamId || !projectId) return;
    try {
      const data = await fetchProjectMembers(teamId, projectId);
      const mapped = (data ?? []).map((member: { userId: string; name: string; email?: string | null; avatarUrl?: string | null; backgroundImageUrl?: string | null; bio?: string | null; role: string }) => {
        const mappedRole = mapProjectRole(member.role);
        return {
          id: member.userId,
          name: member.name,
          displayName: member.name,
          email: member.email ?? "",
          role: mappedRole,
          description: member.bio ?? undefined,
          avatarUrl: member.avatarUrl ?? undefined,
          backgroundImageUrl: member.backgroundImageUrl ?? undefined,
          joinedAt: Date.now(),
          lastActiveAt: Date.now(),
        };
      });
      const map = Object.fromEntries(mapped.map((m: Member) => [m.id, m]));
      setMembers(map);
      setMemberIds(mapped.map((m: Member) => m.id));
      if (!selectedMemberId && mapped[0]) {
        setSelectedMemberId(mapped[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch project members", err);
      show({
        title: "멤버 로딩 실패",
        description: "프로젝트 멤버를 불러오지 못했습니다.",
        variant: "error",
      });
    }
  };

  useEffect(() => {
    if (!teamId || !projectId) return;
    loadMembers();
  }, [teamId, projectId, show]);

  useEffect(() => {
    if (!teamId || !projectId) return;
    fetchProjects(teamId)
      .then((items) => {
        const current = (items ?? []).find((item: { id: string; name?: string }) => item.id === projectId);
        setProjectName(current?.name ?? "");
      })
      .catch(() => setProjectName(""));
  }, [projectId, teamId]);

  useEffect(() => {
    if (!workspace?.id || !teamId) return;
    const loadTeamMembers = async () => {
      try {
        const data = await fetchTeamMembers(workspace.id, teamId);
        const mapped = (data ?? []).map((member: { userId: string; name: string; email?: string | null }) => ({
          id: member.userId,
          name: member.name,
          email: member.email ?? null,
        }));
        setTeamMembers(mapped);
      } catch (err) {
        console.error("Failed to fetch team members", err);
      }
    };
    loadTeamMembers();
  }, [teamId, workspace?.id]);

  const handleInvite = async (payload: { userId: string; role: Member["role"] }) => {
    if (!teamId || !projectId) return;
    try {
      await addProjectMember(teamId, projectId, {
        userId: payload.userId,
        role: mapMemberRoleToProjectRole(payload.role ?? "member"),
      });
      await loadMembers();
      show({
        title: "멤버 추가 완료",
        description: "프로젝트 멤버가 추가되었습니다.",
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to add project member", err);
      show({
        title: "멤버 추가 실패",
        description: "권한 또는 입력값을 확인해주세요.",
        variant: "error",
      });
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const orderedMembers: Member[] = useMemo(() => {
    const list = memberIds
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
    return list;
  }, [memberIds, members, normalizedQuery, presence]);

  useEffect(() => {
    if (!selectedMemberId && orderedMembers[0]) {
      setSelectedMemberId(orderedMembers[0].id);
    }
  }, [orderedMembers, selectedMemberId]);

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
  }, []);

  useEffect(() => {
    setProfilePrefs(loadProfilePrefs());
    const onProfilePrefs = () => setProfilePrefs(loadProfilePrefs());
    window.addEventListener(USER_PROFILE_PREFS_EVENT, onProfilePrefs);
    return () => window.removeEventListener(USER_PROFILE_PREFS_EVENT, onProfilePrefs);
  }, []);

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
  }, [profile?.avatarUrl, profile?.backgroundImageUrl, profile?.displayName, profile?.id, profile?.name, profilePrefs]);

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
  }, [memberIds, myPresence, profile?.id]);

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
    [teamMembers, members]
  );
  const myProjectRole = profile?.id ? members[profile.id]?.role : undefined;
  const canManageProjectRoles = myProjectRole === "owner";
  const total = orderedMembers.length;
  const online = orderedMembers.filter((member) => (presence[member.id]?.status ?? "offline") === "online").length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <header className="border-b border-border bg-panel/70">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-10">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
            <Users size={18} className="text-brand"/>
            <div className="text-xl font-semibold text-foreground">멤버</div>
          </div>
            <p className="text-sm text-muted">프로젝트 참여 멤버를 검색하고 상태를 관리합니다.</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
              <span>전체 {total}명</span>
              <span>온라인 {online}명</span>
              <span>오프라인 {Math.max(total - online, 0)}명</span>
            </div>
          </div>
          <Dialog.Root open={inviteOpen} onOpenChange={setInviteOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90"
              >
                <UserPlus size={16} />
                멤버 추가
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-20 z-50 w-[520px] -translate-x-1/2 rounded-2xl border border-border bg-panel p-6 shadow-panel focus:outline-none">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold">프로젝트 멤버 추가</Dialog.Title>
                  <Dialog.Close className="rounded-full border border-border/70 p-1 text-muted transition hover:text-foreground" aria-label="닫기">
                    <X size={16} />
                  </Dialog.Close>
                </div>
                <div className="mt-4">
                  <InviteForm
                    members={availableTeamMembers}
                    onCancel={() => setInviteOpen(false)}
                    onSubmit={(payload) => {
                      handleInvite(payload);
                      setInviteOpen(false);
                    }}
                  />
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col px-4 py-6 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div className="relative w-full max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="이름, 이메일, 역할 검색"
              className="w-full rounded-lg border border-border bg-background/80 py-2 pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
          </div>
          <div className="text-xs text-muted">표시 {orderedMembers.length} / {memberIds.length}</div>
        </div>

        <div className="mt-2 hidden grid-cols-[minmax(0,2fr)_120px_120px_minmax(0,1.2fr)_220px] items-center gap-4 border-b border-border/70 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted md:grid">
          <span>멤버</span>
          <span>상태</span>
          <span>권한</span>
          <span>자기소개</span>
          <span className="text-right">관리</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-b border-border/70">
          {orderedMembers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">조건에 맞는 멤버가 없습니다.</div>
          ) : (
            <div>
              {orderedMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  presence={presence[member.id]}
                  canEditStatus={member.id === profile?.id}
                  selected={selectedMember?.id === member.id}
                  onSelect={() => {
                    setSelectedMemberId(member.id);
                    setProfileOpen(true);
                  }}
                  onStatusChange={(status) => {
                    if (member.id !== profile?.id) return;
                    setMyPresence(status);
                    saveUserPresence(status);
                    setPresence((prev) => ({
                      ...prev,
                      [member.id]: {
                        memberId: member.id,
                        status,
                        lastSeenAt: Date.now(),
                      },
                    }));
                  }}
                  onSendDm={() => {
                    if (!profile?.id) return;
                    if (member.id === profile.id) return;
                    const channelId = startGroupDM([member.id]);
                    if (!channelId) return;
                    router.push(buildHref(["chat", channelId], `/chat/${channelId}`));
                  }}
                  onRemove={() => {
                    if (window.confirm(`${member.name}을(를) 삭제할까요?`)) {
                      if (!teamId || !projectId) return;
                      removeProjectMember(teamId, projectId, member.id)
                        .then(() => {
                          setMembers((prev) => {
                            const next = { ...prev };
                            delete next[member.id];
                            return next;
                          });
                          setMemberIds((prev) => prev.filter((id) => id !== member.id));
                          show({
                            title: "멤버 삭제 완료",
                            description: "프로젝트 멤버가 삭제되었습니다.",
                            variant: "success",
                          });
                        })
                        .catch((err) => {
                          console.error("Failed to remove project member", err);
                          show({
                            title: "멤버 삭제 실패",
                            description: "권한 또는 입력값을 확인해주세요.",
                            variant: "error",
                          });
                        });
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog.Root open={profileOpen && !!selectedMember} onOpenChange={setProfileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-20 z-50 w-[500px] max-w-[92vw] -translate-x-1/2 rounded-2xl border border-border bg-panel p-5 shadow-panel focus:outline-none">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-foreground">멤버 프로필</Dialog.Title>
              <Dialog.Close className="rounded-full border border-border/70 p-1 text-muted transition hover:text-foreground" aria-label="닫기">
                <X size={16} />
              </Dialog.Close>
            </div>
            <div className="mt-4">
              <MemberProfilePanel
                member={selectedMember ?? null}
                presence={selectedMember ? presence[selectedMember.id] : undefined}
                canEditPresence={selectedMember?.id === profile?.id}
                canEditProfile={selectedMember?.id === profile?.id}
                canRemove={selectedMember?.id !== profile?.id}
                canChangeRole={!!selectedMember && selectedMember.id !== profile?.id && canManageProjectRoles}
                projectName={projectName || undefined}
                onPresenceChange={(status) => {
                  if (!selectedMember) return;
                  if (selectedMember.id !== profile?.id) return;
                  setMyPresence(status);
                  saveUserPresence(status);
                  setPresence((prev) => ({
                    ...prev,
                    [selectedMember.id]: {
                      memberId: selectedMember.id,
                      status,
                      lastSeenAt: Date.now(),
                    },
                  }));
                }}
                onRoleChange={async (role) => {
                  if (!selectedMember || !teamId || !projectId) return;
                  if (!canManageProjectRoles || selectedMember.id === profile?.id) return;
                  try {
                    await updateProjectMemberRole(teamId, projectId, {
                      userId: selectedMember.id,
                      role: mapMemberRoleToProjectRole(role),
                    });
                    setMembers((prev) => ({
                      ...prev,
                      [selectedMember.id]: {
                        ...prev[selectedMember.id],
                        role,
                      },
                    }));
                    show({
                      title: "권한 변경 완료",
                      description: `${selectedMember.name} 권한이 변경되었습니다.`,
                      variant: "success",
                    });
                  } catch (err) {
                    console.error("Failed to update project member role", err);
                    show({
                      title: "권한 변경 실패",
                      description: "권한 또는 입력값을 확인해주세요.",
                      variant: "error",
                    });
                  }
                }}
                onProfileSave={async (patch) => {
                  if (!selectedMember || selectedMember.id !== profile?.id) return;
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
                    [selectedMember.id]: {
                      ...prev[selectedMember.id],
                      name: patch.displayName?.trim() || prev[selectedMember.id]?.name || selectedMember.name,
                      displayName: patch.displayName?.trim() || prev[selectedMember.id]?.displayName || selectedMember.displayName,
                      avatarUrl: patch.avatarUrl ?? prev[selectedMember.id]?.avatarUrl,
                      backgroundImageUrl: patch.backgroundImageUrl ?? prev[selectedMember.id]?.backgroundImageUrl,
                      description: patch.bio ?? prev[selectedMember.id]?.description,
                    },
                  }));
                  setProfileOpen(false);
                }}
                onCancel={() => setProfileOpen(false)}
                onRemove={(memberId) => {
                  if (window.confirm("정말 삭제할까요?")) {
                    if (!teamId || !projectId) return;
                    removeProjectMember(teamId, projectId, memberId)
                      .then(() => {
                        setMembers((prev) => {
                          const next = { ...prev };
                          delete next[memberId];
                          return next;
                        });
                        setMemberIds((prev) => prev.filter((id) => id !== memberId));
                        setProfileOpen(false);
                        show({
                          title: "멤버 삭제 완료",
                          description: "프로젝트 멤버가 삭제되었습니다.",
                          variant: "success",
                        });
                      })
                      .catch((err) => {
                        console.error("Failed to remove project member", err);
                        show({
                          title: "멤버 삭제 실패",
                          description: "권한 또는 입력값을 확인해주세요.",
                          variant: "error",
                        });
                      });
                  }
                }}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
