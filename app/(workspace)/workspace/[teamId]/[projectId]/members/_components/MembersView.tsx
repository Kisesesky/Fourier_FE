// components/members/MembersView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, Clock3, Search, UserPlus, Users, X } from "lucide-react";
import MemberCard from "./MemberCard";
import MemberProfilePanel from "./MemberProfilePanel";
import InviteForm from "./InviteForm";
import { useMembers } from "@/workspace/members/_model/store";
import type { Member, MemberInvite, PresenceStatus } from "@/workspace/members/_model/types";

const presenceOrder: Record<PresenceStatus, number> = {
  online: 0,
  dnd: 1,
  away: 2,
  offline: 3,
};

export default function MembersView() {
  const { members, memberIds, invites, presence, selectedMemberId } = useMembers((state) => ({
    members: state.members,
    memberIds: state.memberIds,
    invites: state.invites,
    presence: state.presence,
    selectedMemberId: state.selectedMemberId,
  }));
  const sendInvite = useMembers((state) => state.sendInvite);
  const acceptInvite = useMembers((state) => state.acceptInvite);
  const declineInvite = useMembers((state) => state.declineInvite);
  const toggleFavorite = useMembers((state) => state.toggleFavorite);
  const removeMember = useMembers((state) => state.removeMember);
  const setSelectedMember = useMembers((state) => state.setSelectedMember);
  const setPresence = useMembers((state) => state.setPresence);
  const clearPresenceStaleness = useMembers((state) => state.clearPresenceStaleness);

  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => clearPresenceStaleness(), 60_000);
    return () => clearInterval(timer);
  }, [clearPresenceStaleness]);

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
      setSelectedMember(orderedMembers[0].id);
    }
  }, [orderedMembers, selectedMemberId, setSelectedMember]);

  const selectedMember = selectedMemberId ? members[selectedMemberId] ?? null : null;
  const pendingInvites = invites.filter((invite) => invite.status === "pending");
  const total = orderedMembers.length;
  const favorites = orderedMembers.filter((member) => member.isFavorite).length;
  const online = Object.values(presence).filter((record) => record.status === "online").length;

  return (
    <div className="flex h-full flex-col gap-6">
      <section className="rounded-3xl border border-border bg-panel/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-brand">팀 멤버 관리</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Members</h1>
            <p className="text-sm text-muted">친구 초대, 온라인 상태, 즐겨찾기를 한 곳에서 제어합니다.</p>
          </div>
          <Dialog.Root open={inviteOpen} onOpenChange={setInviteOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
              >
                <UserPlus size={16} />
                친구 초대
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-20 z-50 w-[520px] -translate-x-1/2 rounded-3xl border border-border bg-panel p-6 shadow-panel focus:outline-none">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold">친구 초대</Dialog.Title>
                  <Dialog.Close className="rounded-full border border-border/70 p-1 text-muted transition hover:text-foreground" aria-label="닫기">
                    <X size={16} />
                  </Dialog.Close>
                </div>
                <div className="mt-4">
                  <InviteForm
                    onCancel={() => setInviteOpen(false)}
                    onSubmit={(payload) => {
                      sendInvite(payload);
                      setInviteOpen(false);
                    }}
                  />
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-3">
          <StatsBlock label="총 멤버" value={`${total}명`} description="활성 상태 기준" />
          <StatsBlock label="온라인" value={`${online}명`} description="10분 이내 활동" />
          <StatsBlock label="즐겨찾기" value={`${favorites}명`} description="중요한 멤버" />
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
                <UsersBadge label="Favorites" value={favorites} />
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
                    setSelectedMember(member.id);
                    setProfileOpen(true);
                  }}
                  onToggleFavorite={() => toggleFavorite(member.id)}
                  onRemove={() => {
                    if (window.confirm(`${member.name}을(를) 삭제할까요?`)) {
                      removeMember(member.id);
                    }
                  }}
                />
              ))}
            </div>
          </section>

          {pendingInvites.length > 0 && (
            <section className="rounded-3xl border border-border bg-panel/70 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">대기 중 초대 {pendingInvites.length}건</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <Clock3 size={14} />
                  최근 {pendingInvites[0].invitedByName} 초대
                </span>
              </div>
              <div className="space-y-3">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <InviteAvatar invite={invite} />
                      <div>
                        <div className="font-semibold text-foreground">{invite.name ?? invite.email}</div>
                        <p className="text-xs text-muted">
                          {invite.email} • {invite.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => acceptInvite(invite.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1.5 font-semibold text-emerald-600 transition hover:bg-emerald-50"
                      >
                        <CheckCircle2 size={14} />
                        수락
                      </button>
                      <button
                        type="button"
                        onClick={() => declineInvite(invite.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-muted transition hover:text-foreground"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
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
                  if (selectedMember) setPresence(selectedMember.id, status);
                }}
                onRemove={(memberId) => {
                  if (window.confirm("정말 삭제할까요?")) {
                    removeMember(memberId);
                    setProfileOpen(false);
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

function InviteAvatar({ invite }: { invite: MemberInvite }) {
  const label = invite.name ?? invite.email;
  if (invite.avatarUrl) {
    return (
      <img
        src={invite.avatarUrl}
        alt={label}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }
  const initials = label
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/20 text-xs font-semibold text-muted">
      {initials}
    </div>
  );
}
