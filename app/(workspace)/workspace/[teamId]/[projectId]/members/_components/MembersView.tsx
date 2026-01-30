// components/members/MembersView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, UserPlus, Users, X } from "lucide-react";
import MemberCard from "./MemberCard";
import MemberProfilePanel from "./MemberProfilePanel";
import InviteForm from "./InviteForm";
import { useParams } from "next/navigation";
import { addProjectMember, fetchProjectMembers, removeProjectMember } from "@/lib/projects";
import { fetchTeamMembers } from "@/lib/team";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/components/ui/Toast";
import type { Member, PresenceStatus } from "@/workspace/members/_model/types";

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
  const { show } = useToast();
  const { workspace } = useWorkspace();
  const [members, setMembers] = useState<Record<string, Member>>({});
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [presence, setPresence] = useState<Record<string, { memberId: string; status: PresenceStatus; lastSeenAt: number }>>({});
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email?: string | null }>>([]);

  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const loadMembers = async () => {
    if (!teamId || !projectId) return;
    try {
      const data = await fetchProjectMembers(teamId, projectId);
      const mapped = (data ?? []).map((member: { userId: string; name: string; email?: string | null; avatarUrl?: string | null; role: string }) => ({
        id: member.userId,
        name: member.name,
        email: member.email ?? "",
        role: mapProjectRole(member.role),
        avatarUrl: member.avatarUrl ?? undefined,
        joinedAt: Date.now(),
        lastActiveAt: Date.now(),
      }));
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
  }, [teamId, projectId, selectedMemberId, show]);

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

  const selectedMember = selectedMemberId ? members[selectedMemberId] ?? null : null;
  const availableTeamMembers = useMemo(
    () => teamMembers.filter((member) => !members[member.id]),
    [teamMembers, members]
  );
  const total = orderedMembers.length;
  const online = Object.values(presence).filter((record) => record.status === "online").length;

  return (
    <div className="flex h-full flex-col gap-6">
      <section className="rounded-3xl border border-border bg-panel/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-brand">팀 멤버 관리</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Members</h1>
            <p className="text-sm text-muted">프로젝트 멤버를 추가하고 상태를 확인합니다.</p>
          </div>
          <Dialog.Root open={inviteOpen} onOpenChange={setInviteOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
              >
                <UserPlus size={16} />
                프로젝트 멤버 추가
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-20 z-50 w-[520px] -translate-x-1/2 rounded-3xl border border-border bg-panel p-6 shadow-panel focus:outline-none">
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
        <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2">
          <StatsBlock label="총 멤버" value={`${total}명`} description="활성 상태 기준" />
          <StatsBlock label="온라인" value={`${online}명`} description="10분 이내 활동" />
        </div>
      </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-panel/70 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="이름, 이메일, 역할 검색"
                  className="w-full rounded-2xl border border-border bg-background/80 pl-9 pr-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <UsersBadge label="Online" value={online} />
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {orderedMembers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border/80 p-6 text-center text-sm text-muted">
                  조건에 맞는 멤버가 없습니다.
                </div>
              )}
              {orderedMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  presence={presence[member.id]}
                  selected={selectedMember?.id === member.id}
                  onSelect={() => {
                    setSelectedMemberId(member.id);
                    setProfileOpen(true);
                  }}
                  onToggleFavorite={() => {
                    setMembers((prev) => ({
                      ...prev,
                      [member.id]: { ...prev[member.id], isFavorite: !prev[member.id]?.isFavorite },
                    }));
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
          </section>

      </div>

      <Dialog.Root open={profileOpen && !!selectedMember} onOpenChange={setProfileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-20 z-50 w-[420px] -translate-x-1/2 rounded-3xl border border-border bg-panel p-5 shadow-panel focus:outline-none">
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
                onPresenceChange={(status) => {
                  if (!selectedMember) return;
                  setPresence((prev) => ({
                    ...prev,
                    [selectedMember.id]: {
                      memberId: selectedMember.id,
                      status,
                      lastSeenAt: Date.now(),
                    },
                  }));
                }}
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

function StatsBlock({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-background/50 p-3">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="text-[11px] text-muted">{description}</p>
    </div>
  );
}

function UsersBadge({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1">
      <Users size={12} />
      <span className="text-[11px] uppercase tracking-wide">
        {label} • {value}
      </span>
    </span>
  );
}
