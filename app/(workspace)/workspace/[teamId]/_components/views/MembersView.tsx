'use client';

import { useMemo, useState } from "react";
import clsx from "clsx";
import { CheckCircle, Copy, Search, UserPlus, X } from "lucide-react";
import {
  defaultInvites,
  defaultMembers,
  defaultPresence,
  createPresenceMap,
} from "@/workspace/members/_model/mocks";
import type { MemberRole, PresenceStatus } from "@/workspace/members/_model/types";

const roleLabels: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  guest: "Guest",
};

const inviteRoles: MemberRole[] = ["owner", "admin", "member", "guest"];

const statusColor: Record<PresenceStatus, string> = {
  online: "bg-emerald-400/10 text-emerald-300",
  away: "bg-amber-400/10 text-amber-200",
  offline: "bg-slate-500/15 text-muted",
  dnd: "bg-rose-500/15 text-rose-300",
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
  onEmailChange: (value: string) => void;
  onRoleChange: (value: MemberRole) => void;
  onClose: () => void;
}

const InviteMemberModal = ({ open, email, role, onEmailChange, onRoleChange, onClose }: InviteMemberModalProps) => {
  if (!open) return null;
  const inviteLink = "fourier.app/invite/workspace";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="w-full max-w-lg rounded-[28px] border border-border bg-panel p-6 text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffd89c] to-[#f7ae57] text-[#1d1300]">
              <UserPlus size={20} />
            </span>
            <div>
              <p className="text-lg font-semibold">Invite teammates</p>
              <p className="text-xs uppercase tracking-[0.4em] text-muted">Share access</p>
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
            <label className="text-[11px] font-semibold uppercase tracking-[0.4em] text-muted">People</label>
            <div className="rounded-2xl border border-border bg-panel px-4 py-3">
              <input
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="name@fourier.app"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-semibold uppercase tracking-[0.4em] text-muted">Role</label>
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

          <button
            type="button"
            disabled={!email.trim()}
            className="w-full rounded-full bg-[#f7ce9c] px-4 py-2 text-sm font-semibold text-[#1a1203] transition disabled:opacity-40"
          >
            Send invite
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-border px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-muted">Share link</p>
          <p className="mt-2 text-sm text-muted">People with this link can request access.</p>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-black/30 px-3 py-2 text-xs text-muted">
            <span className="truncate">{inviteLink}</span>
            <button type="button" className="flex items-center gap-1 text-foreground hover:text-foreground">
              <Copy size={14} />
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MembersView = () => {
  const [activeMemberTab, setActiveMemberTab] = useState<"Members" | "Pending Invites" | "Roles">("Members");
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("member");
  const [showInviteModal, setShowInviteModal] = useState(false);

  const presenceMap = useMemo(() => createPresenceMap(defaultPresence), []);
  const onlineCount = defaultPresence.filter((presence) => presence.status === "online").length;
  const favoriteCount = defaultMembers.filter((member) => member.isFavorite).length;

  const stats = [
    { id: "total", label: "Workspace members", value: defaultMembers.length, helper: `${onlineCount} online` },
    { id: "pending", label: "Pending invites", value: defaultInvites.length, helper: "Auto-expire in 7 days" },
    { id: "favorites", label: "Favorites", value: favoriteCount, helper: "Star from profile" },
  ];

  const normalizedSearch = search.trim().toLowerCase();
  const filteredMembers = useMemo(() => {
    if (!normalizedSearch) return defaultMembers;
    return defaultMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(normalizedSearch) ||
        member.email.toLowerCase().includes(normalizedSearch) ||
        (member.location ?? "").toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  const renderMembers = () => (
    <div className="divide-y divide-border">
      <div className="grid grid-cols-[1.6fr,1.4fr,1fr,1fr] px-3 pb-3 text-[11px] uppercase tracking-[0.4em] text-muted">
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
            <div key={member.id} className="grid grid-cols-[1.6fr,1.4fr,1fr,1fr] items-center gap-4 px-3 py-4">
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
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">{roleLabels[member.role]}</span>
              <div className="text-sm text-muted">
                <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold uppercase", statusColor[presenceStatus])}>
                  {presenceStatus}
                </span>
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
      {defaultInvites.map((invite) => (
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
      ))}
    </div>
  );

  const renderRoles = () => (
    <div className="space-y-4">
      {inviteRoles.map((role) => (
        <div key={role} className="rounded-2xl border border-border bg-panel p-5">
          <p className="text-lg font-semibold text-foreground">{roleLabels[role]}</p>
          <p className="mt-2 text-sm text-muted">
            {role === "owner"
              ? "Full control over billing, roles, and workspace security."
              : role === "admin"
                ? "Manage members, edit workspace resources, and run deploys."
                : role === "member"
                  ? "Collaborate on every project with edit access."
                  : "Read-only visibility with ability to comment."}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {role === "guest" ? (
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400" />
                Comment + view resources
              </li>
            ) : (
              <>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-400" />
                  Invite teammates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-400" />
                  Manage collections and projects
                </li>
              </>
            )}
          </ul>
        </div>
      ))}
      <button
        type="button"
        className="w-full rounded-2xl border border-dashed border-border py-4 text-sm text-muted transition hover:bg-accent hover:text-foreground"
      >
        + Create custom role
      </button>
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
              className="rounded-full border border-border px-3 py-1.5 text-xs uppercase tracking-[0.3em] hover:bg-accent hover:text-foreground"
            >
              Export
            </button>
            <button
              type="button"
              className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] hover:bg-accent/80"
              onClick={() => setShowInviteModal(true)}
            >
              Invite teammates
            </button>
          </div>
        </div>
        <div className="pt-4">{tabContent[activeMemberTab]}</div>
      </div>

      <InviteMemberModal
        open={showInviteModal}
        email={inviteEmail}
        role={inviteRole}
        onEmailChange={setInviteEmail}
        onRoleChange={setInviteRole}
        onClose={() => setShowInviteModal(false)}
      />
    </section>
  );
};

export default MembersView;

