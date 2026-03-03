'use client';

import * as Dialog from "@radix-ui/react-dialog";
import { Search, UserPlus, Users, X } from "lucide-react";
import MemberCard from "./MemberCard";
import MemberProfilePanel from "./MemberProfilePanel";
import InviteForm from "./InviteForm";
import { useMembersViewController } from "@/workspace/members/_model/hooks";

export default function MembersView() {
  const {
    teamId,
    projectId,
    profile,
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
    handleInvite,
    handleSendDm,
    removeMember,
    handleRoleChange,
    handleProfileSave,
    updateMyPresence,
  } = useMembersViewController();

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <header className="border-b border-border bg-panel/70">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-10">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <Users size={18} className="text-brand" />
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
                      void handleInvite(payload);
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
          <div className="text-xs text-muted">표시 {orderedMembers.length}</div>
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
                  canSendDm={member.id !== profile?.id}
                  canRemoveAction={member.id !== profile?.id}
                  selected={selectedMember?.id === member.id}
                  onSelect={() => {
                    setSelectedMemberId(member.id);
                    setProfileOpen(true);
                  }}
                  onStatusChange={(status) => {
                    if (member.id !== profile?.id) return;
                    updateMyPresence(member.id, status);
                  }}
                  onSendDm={() => {
                    handleSendDm(member.id);
                  }}
                  onRemove={() => {
                    if (!window.confirm(`${member.name}을(를) 삭제할까요?`)) return;
                    void removeMember(member.id);
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
                isSelf={selectedMember?.id === profile?.id}
                canChangeRole={!!selectedMember && selectedMember.id !== profile?.id && canManageProjectRoles}
                projectName={projectName || undefined}
                onPresenceChange={(status) => {
                  if (!selectedMember || selectedMember.id !== profile?.id) return;
                  updateMyPresence(selectedMember.id, status);
                }}
                onRoleChange={async (role) => {
                  if (!selectedMember || !teamId || !projectId) return;
                  if (!canManageProjectRoles || selectedMember.id === profile?.id) return;
                  await handleRoleChange(selectedMember.id, role, selectedMember.name);
                }}
                onProfileSave={async (patch) => {
                  if (!selectedMember || selectedMember.id !== profile?.id) return;
                  await handleProfileSave(selectedMember.id, patch);
                }}
                onCancel={() => setProfileOpen(false)}
                onRemove={(memberId) => {
                  if (!window.confirm("정말 삭제할까요?")) return;
                  void removeMember(memberId).then(() => setProfileOpen(false));
                }}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
