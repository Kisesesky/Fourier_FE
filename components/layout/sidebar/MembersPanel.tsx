// components/layout/sidebar/MembersPanel.tsx
'use client';

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, MessageCircle, MoreHorizontal, X } from "lucide-react";

import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useChat } from "@/workspace/chat/_model/store";
import { fetchProjectMembers, fetchProjects, removeProjectMember } from "@/lib/projects";
import { fetchPresence } from "@/lib/members";
import MemberProfilePanel from "@/workspace/members/_components/MemberProfilePanel";
import { loadUserPresence, saveUserPresence, USER_PRESENCE_EVENT, type UserPresenceStatus } from "@/lib/presence";
import { loadProfilePrefs, saveProfilePrefs, USER_PROFILE_PREFS_EVENT } from "@/lib/profile-prefs";
import { updateProfile } from "@/lib/auth";
import { Section, StatusIcon } from "./sidebar.shared";

export default function MembersPanel() {
  const { teamId, projectId } = useParams<{ teamId: string; projectId: string }>();
  const router = useRouter();
  const { buildHref } = useWorkspacePath();
  const { startGroupDM } = useChat();
  const { profile } = useAuthProfile();
  const [members, setMembers] = useState<Array<{ id: string; name: string; displayName?: string | null; avatarUrl?: string | null; backgroundImageUrl?: string | null; email?: string | null; description?: string; role: "owner" | "manager" | "member" | "guest"; status?: "online" | "offline" | "away" | "dnd" }>>([]);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [statusMap, setStatusMap] = useState<Record<string, "online" | "offline" | "away" | "dnd">>({});
  const [myPresence, setMyPresence] = useState<UserPresenceStatus>("online");
  const [profilePrefs, setProfilePrefs] = useState<{ displayName: string; avatarUrl: string; backgroundImageUrl: string }>({
    displayName: "",
    avatarUrl: "",
    backgroundImageUrl: "",
  });
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [myStatusOpen, setMyStatusOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    if (!teamId || !projectId) return;
    let mounted = true;
    fetchProjectMembers(teamId, projectId)
      .then((data) => {
        if (!mounted) return;
        const mapped = (data ?? []).map((member: { userId: string; name: string; displayName?: string | null; avatarUrl?: string | null; backgroundImageUrl?: string | null; email?: string | null; bio?: string | null; role?: string }) => ({
          id: member.userId,
          name: member.name,
          displayName: member.displayName ?? member.name,
          avatarUrl: member.avatarUrl ?? null,
          backgroundImageUrl: member.backgroundImageUrl ?? null,
          email: member.email ?? null,
          description: member.bio ?? undefined,
          role:
            member.role === "OWNER"
              ? "owner"
              : member.role === "MANAGER"
                ? "manager"
                : member.role === "GUEST"
                  ? "guest"
                  : "member",
          status: "offline",
        }));
        setMembers(mapped);
      })
      .catch(() => {
        if (!mounted) return;
        setMembers([]);
      });
    return () => {
      mounted = false;
    };
  }, [teamId, projectId]);

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
    let mounted = true;
    const loadPresence = async () => {
      try {
        const payload = await fetchPresence();
        if (!mounted) return;
        setOnlineIds(new Set(payload.onlineUserIds || []));
        setStatusMap((payload.statuses || {}) as Record<string, "online" | "offline" | "away" | "dnd">);
      } catch {
        if (!mounted) return;
        setOnlineIds(new Set());
        setStatusMap({});
      }
    };
    void loadPresence();
    const interval = window.setInterval(loadPresence, 20000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

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
    if (!menuOpenId && !myStatusOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest("[data-member-menu='true']") && !event.target.closest("[data-my-status-menu='true']")) {
        setMenuOpenId(null);
        setMyStatusOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpenId(null);
        setMyStatusOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onEscape);
    };
  }, [menuOpenId, myStatusOpen]);

  const meId = profile?.id;
  const myAvatarUrl = (profilePrefs.avatarUrl || profile?.avatarUrl || undefined) as string | undefined;
  const membersById = useMemo(
    () => Object.fromEntries(members.map((member) => [member.id, member])),
    [members],
  );
  const rest = members.filter((m) => m.id !== meId).slice(0, 8);
  const onlineMembers = rest.filter((m) => {
    const status = statusMap[m.id] ?? (onlineIds.has(m.id) ? "online" : "offline");
    return status !== "offline";
  });
  const offlineMembers = rest.filter((m) => {
    const status = statusMap[m.id] ?? (onlineIds.has(m.id) ? "online" : "offline");
    return status === "offline";
  });
  const meStatus: "online" | "offline" | "away" | "dnd" = meId ? myPresence : "offline";
  const selectedMember =
    selectedMemberId === meId && profile
      ? {
          id: profile.id,
          name: profilePrefs.displayName || profile.displayName || profile.name || profile.email || "Me",
          displayName: profilePrefs.displayName || profile.displayName || profile.name || profile.email || "Me",
          email: profile.email ?? "",
          avatarUrl: profilePrefs.avatarUrl || profile.avatarUrl || null,
          backgroundImageUrl: profilePrefs.backgroundImageUrl || profile.backgroundImageUrl || null,
          description: profile.bio ?? undefined,
          role: (membersById[profile.id]?.role ?? "member") as "owner" | "manager" | "member" | "guest",
        }
      : selectedMemberId
        ? membersById[selectedMemberId] ?? null
        : null;

  const statusLabel = (status: "online" | "offline" | "away" | "dnd") => {
    if (status === "online") return "온라인";
    if (status === "away") return "자리비움";
    if (status === "dnd") return "방해금지";
    return "오프라인";
  };

  return (
    <div className="space-y-3">
        {profile ? (
          <button
            type="button"
            onClick={() => {
              if (meId) setSelectedMemberId(meId);
            }}
            className="flex w-full items-center gap-3 rounded-lg border border-border/60 px-3 py-2 text-left transition hover:bg-sidebar-accent"
          >
            <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted/30">
              {myAvatarUrl ? (
                <img src={myAvatarUrl} alt={profile.displayName ?? profile.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-foreground">
                  {(profilePrefs.displayName || profile.displayName || profile.name || profile.email || "?").slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-foreground">
                {profilePrefs.displayName || profile.displayName || profile.name || profile.email || "Me"}
              </div>
              <div className="relative" data-my-status-menu="true">
                <button
                  type="button"
                  onClick={() => setMyStatusOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 truncate rounded-md px-1 py-0.5 text-[11px] text-muted transition hover:bg-sidebar-accent"
                >
                  <StatusIcon status={meStatus} />
                  {statusLabel(meStatus)}
                  <ChevronDown size={12} />
                </button>
                {myStatusOpen && (
                  <div className="absolute left-0 top-6 z-30 w-32 rounded-md border border-border bg-panel py-1 text-xs shadow-md">
                    {(["online", "offline", "away", "dnd"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setMyPresence(option);
                          saveUserPresence(option);
                          if (meId) setStatusMap((prev) => ({ ...prev, [meId]: option }));
                          setMyStatusOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-foreground hover:bg-sidebar-accent"
                      >
                        <StatusIcon status={option} />
                        {statusLabel(option)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </button>
        ) : (
          <div className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted">
            내 정보를 불러오는 중입니다.
          </div>
        )}

      <Section title={`온라인 ${onlineMembers.length}명`}>
        {onlineMembers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted">
            온라인 멤버가 없습니다.
          </div>
        ) : (
          onlineMembers.map(m => {
            const status = statusMap[m.id] ?? (onlineIds.has(m.id) ? "online" : "offline");
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMemberId(m.id)}
                className="group flex w-full items-center gap-3 rounded-lg border border-border/60 px-3 py-2 text-left transition hover:bg-sidebar-accent"
              >
                <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted/30">
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-foreground">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-foreground">{m.name}</div>
                  <div className="inline-flex items-center gap-1.5 truncate text-[11px] text-muted">
                    <StatusIcon status={status} />
                    {statusLabel(status)}
                  </div>
                </div>
                <div className="relative" data-member-menu="true">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuOpenId((prev) => (prev === m.id ? null : m.id));
                    }}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted opacity-0 transition hover:border-border hover:bg-panel hover:text-foreground group-hover:opacity-100"
                    aria-label="멤버 메뉴"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {menuOpenId === m.id && (
                    <div className="absolute right-0 bottom-8 z-20 w-28 rounded-md border border-border bg-panel py-1 text-xs shadow-md">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!profile?.id) return;
                          const channelId = startGroupDM([m.id]);
                          if (channelId) {
                            router.push(buildHref(["chat", channelId], `/chat/${channelId}`));
                          }
                          setMenuOpenId(null);
                        }}
                        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-foreground hover:bg-sidebar-accent"
                      >
                        <MessageCircle size={12} />
                        DM 보내기
                      </button>
                      <button
                        type="button"
                        onClick={async (event) => {
                          event.stopPropagation();
                          if (!teamId || !projectId) return;
                          await removeProjectMember(teamId, projectId, m.id).catch(() => null);
                          setMembers((prev) => prev.filter((item) => item.id !== m.id));
                          setMenuOpenId(null);
                        }}
                        className="flex w-full items-center px-2.5 py-1.5 text-left text-rose-500 hover:bg-sidebar-accent"
                      >
                        삭제하기
                      </button>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </Section>
      <Section title={`오프라인 ${offlineMembers.length}명`}>
        {offlineMembers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted">
            오프라인 멤버가 없습니다.
          </div>
        ) : (
          offlineMembers.map(m => {
            const status = statusMap[m.id] ?? (onlineIds.has(m.id) ? "online" : "offline");
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMemberId(m.id)}
                className="group flex w-full items-center gap-3 rounded-lg border border-border/60 px-3 py-2 text-left transition hover:bg-sidebar-accent"
              >
                <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted/30">
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-foreground">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-foreground">{m.name}</div>
                  <div className="inline-flex items-center gap-1.5 truncate text-[11px] text-muted">
                    <StatusIcon status={status} />
                    {statusLabel(status)}
                  </div>
                </div>
                <div className="relative" data-member-menu="true">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuOpenId((prev) => (prev === m.id ? null : m.id));
                    }}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted opacity-0 transition hover:border-border hover:bg-panel hover:text-foreground group-hover:opacity-100"
                    aria-label="멤버 메뉴"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {menuOpenId === m.id && (
                    <div className="absolute right-0 bottom-8 z-20 w-28 rounded-md border border-border bg-panel py-1 text-xs shadow-md">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!profile?.id) return;
                          const channelId = startGroupDM([m.id]);
                          if (channelId) {
                            router.push(buildHref(["chat", channelId], `/chat/${channelId}`));
                          }
                          setMenuOpenId(null);
                        }}
                        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-foreground hover:bg-sidebar-accent"
                      >
                        <MessageCircle size={12} />
                        DM 보내기
                      </button>
                      <button
                        type="button"
                        onClick={async (event) => {
                          event.stopPropagation();
                          if (!teamId || !projectId) return;
                          await removeProjectMember(teamId, projectId, m.id).catch(() => null);
                          setMembers((prev) => prev.filter((item) => item.id !== m.id));
                          setMenuOpenId(null);
                        }}
                        className="flex w-full items-center px-2.5 py-1.5 text-left text-rose-500 hover:bg-sidebar-accent"
                      >
                        삭제하기
                      </button>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </Section>

      <Dialog.Root open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMemberId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-20 z-50 w-[500px] max-w-[92vw] -translate-x-1/2 rounded-2xl border border-border bg-panel p-5 shadow-panel focus:outline-none">
            <div className="mb-3 flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-foreground">멤버 프로필</Dialog.Title>
              <Dialog.Close className="rounded-full border border-border/70 p-1 text-muted transition hover:text-foreground" aria-label="닫기">
                <X size={16} />
              </Dialog.Close>
            </div>
            <MemberProfilePanel
              member={
                selectedMember
                  ? {
                      id: selectedMember.id,
                      name: selectedMember.name,
                      displayName: selectedMember.displayName ?? selectedMember.name,
                      email: selectedMember.email ?? "",
                      avatarUrl: selectedMember.avatarUrl ?? undefined,
                      backgroundImageUrl: selectedMember.backgroundImageUrl ?? undefined,
                      description: selectedMember.description ?? undefined,
                      role: selectedMember.role,
                      joinedAt: Date.now(),
                      lastActiveAt: Date.now(),
                    }
                  : null
              }
              presence={
                selectedMember
                  ? {
                      memberId: selectedMember.id,
                      status: selectedMember.id === meId ? meStatus : (statusMap[selectedMember.id] ?? (onlineIds.has(selectedMember.id) ? "online" : "offline")),
                      lastSeenAt: Date.now(),
                    }
                  : undefined
              }
              canEditPresence={selectedMember?.id === meId}
              canEditProfile={selectedMember?.id === meId}
              canRemove={selectedMember?.id !== meId}
              projectName={projectName || undefined}
              onPresenceChange={(status) => {
                if (!selectedMember || selectedMember.id !== meId) return;
                setMyPresence(status);
                saveUserPresence(status);
                setStatusMap((prev) => ({ ...prev, [selectedMember.id]: status }));
              }}
              onProfileSave={async (patch) => {
                if (!selectedMember || selectedMember.id !== meId) return;
                if (patch.displayName !== undefined || patch.bio !== undefined) {
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
                setMembers((prev) =>
                  prev.map((item) =>
                    item.id === meId
                      ? {
                          ...item,
                          name: patch.displayName?.trim() || item.name,
                          displayName: patch.displayName?.trim() || item.displayName,
                          avatarUrl: patch.avatarUrl ?? item.avatarUrl,
                          backgroundImageUrl: patch.backgroundImageUrl ?? item.backgroundImageUrl,
                          description: patch.bio ?? item.description,
                        }
                      : item,
                  ),
                );
                setSelectedMemberId(null);
              }}
              onCancel={() => setSelectedMemberId(null)}
              onRemove={async (memberId) => {
                if (memberId === meId) return;
                if (!teamId || !projectId) return;
                await removeProjectMember(teamId, projectId, memberId).catch(() => null);
                setMembers((prev) => prev.filter((item) => item.id !== memberId));
                setSelectedMemberId(null);
              }}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
