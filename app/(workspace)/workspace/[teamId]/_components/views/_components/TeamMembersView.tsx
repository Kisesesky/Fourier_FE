// app/(workspace)/workspace/[teamId]/_components/views/_components/TeamMembersView.tsx
'use client';

import clsx from "clsx";
import { CheckCircle, Search } from "lucide-react";
import {
  MAX_TEAM_NICKNAME_LENGTH,
  TEAM_PERMISSION_OPTIONS,
} from "../../../_model/constants/view.constants";
import Modal from "@/components/common/Modal";
import InviteMemberModal from "../team-members/_components/InviteMemberModal";
import { TEAM_MEMBER_TABS } from "../team-members/_model/constants/team-members.constants";
import MembersTab from "../team-members/_components/MembersTab";
import PendingInvitesTab from "../team-members/_components/PendingInvitesTab";
import RolesTab from "../team-members/_components/RolesTab";
import type { TeamMembersTab } from "../../../_model/types/team-members.types";
import { useTeamMembersViewController } from "../../../_model/hooks/useTeamMembersViewController";

type TeamMembersViewProps = {
  teamId?: string;
};

const TeamMembersView = ({ teamId }: TeamMembersViewProps) => {
  const {
    profile,
    activeMemberTab,
    search,
    inviteEmail,
    inviteRole,
    inviteMessage,
    showInviteModal,
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
    editingMemberId,
    nicknameDraft,
    avatarDraft,
    nicknameSaving,
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
  } = useTeamMembersViewController(teamId);

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
        onCreateCustomRole={openCreateCustomRole}
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
                if (!isAdmin) return;
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
          const ok = await handleInvite();
          if (!ok) return;
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
        onClose={closeCustomRoleModal}
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
              onClick={closeCustomRoleModal}
            >
              취소
            </button>
            <button
              type="button"
              className="rounded-full bg-foreground px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-background hover:bg-foreground/90"
              onClick={() => {
                void submitCustomRole();
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
              onClick={() => {
                void confirmRemoveMember();
              }}
            >
              삭제
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!editingMemberId}
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
            <p className="text-[11px] text-muted">비워두면 기본 아바타를 사용합니다.</p>
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
