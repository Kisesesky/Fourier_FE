// app/(workspace)/workspace/[teamId]/[projectId]/members/_components/MemberProfilePanel.tsx

import { useEffect, useRef, useState } from "react";
import { Activity, Ban, ChevronDown, Crown, Feather, Flame, Ghost, Mail, MapPin, Moon, Pencil, ShieldCheck, type LucideIcon } from "lucide-react";
import type { Member, MemberPresence, PresenceStatus } from "@/workspace/members/_model/types";

type Props = {
  member: Member | null;
  presence?: MemberPresence;
  canEditPresence?: boolean;
  canEditProfile?: boolean;
  canChangeRole?: boolean;
  canRemove?: boolean;
  isSelf?: boolean;
  projectName?: string;
  onProfileSave?: (patch: { displayName?: string; avatarUrl?: string | null; backgroundImageUrl?: string | null; bio?: string }) => void | Promise<void>;
  onRoleChange?: (role: Member["role"]) => void | Promise<void>;
  onPresenceChange?: (status: PresenceStatus) => void;
  onCancel?: () => void;
  onRemove?: (memberId: string) => void;
};

const presenceLabels: Record<PresenceStatus, string> = {
  online: "온라인",
  away: "자리비움",
  dnd: "방해 금지",
  offline: "오프라인",
};

const roleLabel: Record<Member["role"], string> = {
  owner: "소유자",
  manager: "관리자",
  member: "멤버",
  guest: "게스트",
};

const roleBadgeClass: Record<Member["role"], string> = {
  owner: "border-rose-500 bg-rose-100 text-rose-500/80",
  manager: "border-emerald-500 bg-emerald-100 text-emerald-500/80",
  member: "border-sky-500 bg-sky-100 text-sky-500/80",
  guest: "border-slate-500 bg-slate-100 text-slate-500/80",
};

const roleIcon: Record<Member["role"], LucideIcon> = {
  owner: Crown,
  manager: Flame,
  member: Feather,
  guest: Ghost,
};

const presenceOptions: PresenceStatus[] = ["online", "away", "dnd", "offline"];

type ImageEditorTarget = "avatar" | "background" | null;

export default function MemberProfilePanel({
  member,
  presence,
  canEditPresence = false,
  canEditProfile = false,
  canChangeRole = false,
  canRemove = true,
  isSelf = false,
  projectName,
  onProfileSave,
  onRoleChange,
  onPresenceChange,
  onCancel,
  onRemove,
}: Props) {
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [avatarDraft, setAvatarDraft] = useState("");
  const [backgroundDraft, setBackgroundDraft] = useState("");
  const [bioDraft, setBioDraft] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [imageEditorTarget, setImageEditorTarget] = useState<ImageEditorTarget>(null);
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDisplayNameDraft(member?.displayName ?? member?.name ?? "");
    setAvatarDraft(member?.avatarUrl ?? "");
    setBackgroundDraft(member?.backgroundImageUrl ?? "");
    setBioDraft(member?.description ?? "");
    setEditMode(false);
    setImageEditorTarget(null);
    setIsNameEditing(false);
    setStatusOpen(false);
  }, [member?.avatarUrl, member?.backgroundImageUrl, member?.description, member?.displayName, member?.name]);

  useEffect(() => {
    if (!statusOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setStatusOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setStatusOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onEscape);
    };
  }, [statusOpen]);

  if (!member) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-panel/40 p-6 text-center text-sm text-muted">
        멤버를 선택하면 프로필과 최근 활동을 확인할 수 있어요.
      </div>
    );
  }

  const currentStatus = presence?.status ?? "offline";
  const coverUrl = backgroundDraft || member.backgroundImageUrl || "/error/profile.png";
  const avatarUrl = avatarDraft || member.avatarUrl || "";
  const computedRoleLabel = projectName ? `${projectName} - ${roleLabel[member.role] ?? "멤버"}` : (roleLabel[member.role] ?? "멤버");
  const RoleIcon = roleIcon[member.role] ?? Feather;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel">
      <div className="relative h-72">
        <div className="group/bg absolute inset-0">
          <img src={coverUrl} alt="profile background" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-black/35" />
          {canEditProfile && editMode && (
            <button
              type="button"
              onClick={() => setImageEditorTarget("background")}
              className="absolute inset-0 z-[5] hidden items-center justify-center bg-black/35 text-white transition hover:bg-black/50 group-hover/bg:flex"
              aria-label="배경 이미지 수정"
            >
              <span className="inline-flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-xs font-medium">
                <Pencil size={12} />
                배경 이미지 수정
              </span>
            </button>
          )}
        </div>

        {canEditProfile && (
          <button
            type="button"
            onClick={() => {
              setEditMode((prev) => !prev);
              setImageEditorTarget(null);
            }}
            className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-md bg-black/45 px-2 py-1 text-xs font-medium text-white transition hover:bg-black/60"
            aria-label="이미지 편집 모드"
          >
            <Pencil size={12} />
            {editMode ? "편집중" : "편집"}
          </button>
        )}

        <div className="absolute -bottom-14 left-1/2 z-10 -translate-x-1/2">
          <div className="group relative h-28 w-28 overflow-hidden rounded-full bg-background shadow-lg">
            {avatarUrl ? (
              <img src={avatarUrl} alt={member.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-2xl font-semibold text-slate-600">
                {getInitials(member.name)}
              </div>
            )}

            {canEditProfile && editMode && (
              <button
                type="button"
                onClick={() => setImageEditorTarget("avatar")}
                className="absolute inset-0 hidden items-center justify-center bg-black/45 text-white transition hover:bg-black/55 group-hover:flex"
                aria-label="아바타 이미지 수정"
              >
                <span className="inline-flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-[11px] font-medium">
                  <Pencil size={11} />
                  아바타 수정
                </span>
              </button>
            )}
          </div>
        </div>

      </div>

      <div className="bg-panel px-5 pb-5 pt-16">
        <div className="mb-4 text-center">
          {isNameEditing && canEditProfile ? (
            <div className="mx-auto max-w-[280px]">
              <input
                value={displayNameDraft}
                onChange={(event) => setDisplayNameDraft(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-center text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
                placeholder="표시할 이름"
              />
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
              <span
                className={`inline-flex items-center rounded-full border p-1.5 ${roleBadgeClass[member.role] ?? roleBadgeClass.member}`}
                title={roleLabel[member.role] ?? "멤버"}
              >
                <RoleIcon size={12} />
              </span>
              {isSelf && (
                <span
                  className="inline-flex items-center rounded-full border border-sky-500 bg-sky-100 px-2 py-0.3 text-[11px] font-bold text-sky-500"
                  title="나"
                >
                  <span>ME</span>
                </span>
              )}
              <span>{displayNameDraft || member.displayName || member.name}</span>
              {canEditProfile && editMode && (
                <button
                  type="button"
                  onClick={() => setIsNameEditing(true)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background/80 text-muted transition hover:text-foreground"
                  aria-label="이름 수정"
                >
                  <Pencil size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <label className="inline-flex w-24 shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <Mail size={14} />
              이메일
            </label>
            <div className="flex h-10 flex-1 items-center rounded-lg border border-border bg-background/80 px-3 py-2 font-medium text-foreground break-all">
              {member.email}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex w-24 shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <ShieldCheck size={14} />
              역할
            </label>
            {canChangeRole ? (
              <select
                value={member.role}
                onChange={(event) => onRoleChange?.(event.target.value as Member["role"])}
                className="h-10 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
              >
                <option value="manager">관리자</option>
                <option value="member">멤버</option>
                <option value="guest">게스트</option>
              </select>
            ) : (
              <div className="flex h-10 flex-1 items-center rounded-lg border border-border bg-background/80 px-3 py-2 font-medium text-foreground">
                {computedRoleLabel}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex w-24 shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <Activity size={14} />
              상태
            </label>
            {canEditPresence ? (
              <div className="relative flex-1" ref={statusRef}>
                <button
                  type="button"
                  onClick={() => setStatusOpen((prev) => !prev)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    <StatusChip status={currentStatus} />
                    {presenceLabels[currentStatus]}
                  </span>
                  <ChevronDown size={14} className="text-muted" />
                </button>
                {statusOpen && (
                  <div className="absolute left-0 top-11 z-20 w-full rounded-lg border border-border bg-panel py-1 shadow-lg">
                    {presenceOptions.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          onPresenceChange?.(status);
                          setStatusOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-subtle/80"
                      >
                        <StatusChip status={status} />
                        {presenceLabels[status]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-10 flex-1 items-center rounded-lg border border-border bg-background/80 px-3 py-2 text-sm text-muted">
                <span className="inline-flex items-center gap-2">
                  <StatusChip status={currentStatus} />
                  {presenceLabels[currentStatus]}
                </span>
              </div>
            )}
          </div>

          <div className="mt-1 border-t border-border/70 pt-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">소개</label>
            {canEditProfile ? (
              <textarea
                value={bioDraft}
                onChange={(event) => setBioDraft(event.target.value)}
                className="mt-2 min-h-20 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
                placeholder="소개를 입력하세요"
              />
            ) : (
              <div className="mt-2 rounded-lg border border-border bg-background/80 px-3 py-2 text-sm text-foreground">
                {bioDraft.trim() || "소개가 아직 작성되지 않았습니다."}
              </div>
            )}
          </div>

          {(member.location || member.timezone) && (
            <div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                <MapPin size={14} />
                위치
              </label>
              <div className="mt-2 rounded-lg border border-border bg-background/80 px-3 py-2 font-medium text-foreground">
                {member.location}
                {member.timezone && <span className="ml-1 text-muted">({member.timezone})</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {canEditProfile && (
        <div className="grid grid-cols-2 gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={() =>
              onProfileSave?.({
                displayName: displayNameDraft.trim() || member.displayName || member.name,
                avatarUrl: avatarDraft.trim() || null,
                backgroundImageUrl: backgroundDraft.trim() || null,
                bio: bioDraft,
              })
            }
            className="inline-flex w-full items-center justify-center rounded-lg bg-brand px-2 py-2 text-sm font-semibold text-white transition hover:bg-brand/90"
          >
            저장
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex w-full items-center justify-center rounded-lg border border-border px-2 py-2 text-sm font-semibold text-muted transition hover:bg-subtle/80 hover:text-foreground"
          >
            취소
          </button>
        </div>
      )}

      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove?.(member.id)}
          className="mx-5 mb-5 mt-1 inline-flex w-[calc(100%-2.5rem)] items-center justify-center rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-500 transition hover:bg-rose-500/10"
        >
          멤버 삭제
        </button>
      )}

      {canEditProfile && imageEditorTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-panel p-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-foreground">
              {imageEditorTarget === "avatar" ? "아바타 이미지 URL 수정" : "배경 이미지 URL 수정"}
            </h3>
            <input
              value={imageEditorTarget === "avatar" ? avatarDraft : backgroundDraft}
              onChange={(event) => {
                if (imageEditorTarget === "avatar") {
                  setAvatarDraft(event.target.value);
                } else {
                  setBackgroundDraft(event.target.value);
                }
              }}
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
              placeholder="https://..."
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setImageEditorTarget(null)}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-muted transition hover:bg-subtle/80 hover:text-foreground"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function StatusChip({ status }: { status: PresenceStatus }) {
  if (status === "online") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-600">
        <span className="h-2 w-2 rounded-full bg-sky-500" />
      </span>
    );
  }
  if (status === "offline") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <span className="h-2 w-2 rounded-full bg-zinc-400" />
      </span>
    );
  }
  if (status === "away") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-500">
        <Moon size={11} />
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-500">
      <Ban size={11} />
    </span>
  );
}
