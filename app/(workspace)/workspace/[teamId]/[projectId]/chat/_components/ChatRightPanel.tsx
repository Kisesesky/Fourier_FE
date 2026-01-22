// components/chat/ChatRightPanel.tsx
'use client';

import React, { useMemo, useState, useEffect, JSX } from "react";
import { useChat } from "@/workspace/chat/_model/store";
import Composer from "./Composer";
import EmojiPicker from "./EmojiPicker";
import MarkdownText from "./MarkdownText";
import { CornerUpLeft, Pin, Bookmark, X, Search, Images, Users, UserPlus2, Check } from "lucide-react";
import clsx from "clsx";
import ReadBy from "./ReadBy";
import FilesPanel from "./FilesPanel";
import LinkPreview, { extractUrls } from "./LinkPreview";
import { useToast } from "@/components/ui/Toast";
import type { PresenceState } from "@/workspace/chat/_model/types";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-2 font-semibold border-b border-border">{children}</div>;
}

const presenceColors: Record<PresenceState, string> = {
  online: "bg-emerald-500",
  away: "bg-amber-400",
  busy: "bg-rose-500",
  offline: "bg-zinc-400",
};

const statusLabels: Record<PresenceState, string> = {
  online: "온라인",
  away: "자리비우기",
  busy: "방해금지",
  offline: "오프라인",
};

type FriendRowProps = {
  name: string;
  initials: string;
  avatarUrl?: string;
  snippet?: string;
  unread: number;
  mention: number;
  typing: boolean;
  active: boolean;
  onOpen: () => void;
  status: PresenceState;
  statusLabel: string;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
};

function FriendRow({
  name,
  initials,
  avatarUrl,
  snippet,
  unread,
  mention,
  typing,
  active,
  onOpen,
  status,
  statusLabel,
  selectable = false,
  selected = false,
  onToggleSelect,
}: FriendRowProps) {
  const badgeCount = mention > 0 ? mention : unread;
  const badgeText = badgeCount > 99 ? "99+" : badgeCount > 0 ? String(badgeCount) : "";
  const presenceClass = presenceColors[status] ?? presenceColors.offline;

  const handleClick = () => {
    if (selectable) {
      onToggleSelect?.();
      return;
    }
    onOpen();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        "w-full rounded-md border px-3 py-2 text-left transition focus:outline-none focus:ring-1 focus:ring-brand/60",
        active ? "bg-subtle/80 border-border" : "border-transparent hover:bg-subtle/60",
        selectable && selected ? "ring-1 ring-brand/60" : null
      )}
    >
      <div className="flex items-center gap-3">
        <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-subtle text-xs font-semibold uppercase text-muted overflow-hidden border border-border/70">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            initials || "DM"
          )}
          <span className={clsx("absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-border bg-panel", presenceClass)} />
          {selectable && (
            <span
              className={clsx(
                "absolute -top-1 -left-1 h-4 w-4 rounded-full border border-border bg-panel text-[10px] grid place-items-center",
                selected ? "text-brand" : "text-muted"
              )}
            >
              {selected ? <Check size={10} /> : ""}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={clsx("truncate text-sm", active ? "font-semibold" : "font-medium")}>{name}</span>
            {typing ? (
              <span className="text-[11px] text-emerald-500">typing…</span>
            ) : (
              <span className="text-[11px] text-muted">{statusLabel}</span>
            )}
          </div>
          {snippet && <div className="mt-1 truncate text-xs text-muted">{snippet}</div>}
        </div>
        {badgeText && (
          <span
            className={clsx(
              "min-w-[28px] rounded-full px-2 py-0.5 text-center text-xs font-semibold text-white",
              mention > 0 ? "bg-rose-500" : "bg-brand/80"
            )}
          >
            {badgeText}
          </span>
        )}
      </div>
    </button>
  );
}

type AddFriendModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, status: PresenceState) => void;
};

function AddFriendModal({ open, onClose, onSubmit }: AddFriendModalProps): JSX.Element | null {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<PresenceState>("online");

  useEffect(() => {
    if (!open) {
      setName("");
      setStatus("online");
    }
  }, [open]);

  if (!open) return null;

  const submit = () => {
    onSubmit(name, status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[320px] rounded-xl border border-border bg-panel p-4 shadow-panel space-y-3">
        <div className="text-sm font-semibold">친구 초대</div>
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-xs text-muted">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-border bg-subtle/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand/60"
              placeholder="예: 엘리스"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">상태</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PresenceState)}
                className="w-full rounded-md border border-border bg-subtle/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand/60"
            >
              <option value="online">온라인</option>
              <option value="away">자리비움</option>
              <option value="busy">방해금지</option>
              <option value="offline">오프라인</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
              onClick={onClose}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-subtle/60"
          >
            취소
          </button>
          <button
            type="button"
              onClick={submit}
              className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand/90"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatRightPanel() {
  const {
    threadFor, closeThread, getThread, toggleReaction, togglePin, toggleSave,
    pinnedByChannel, savedByUser, me, users, send, channelActivity, typingUsers, setChannel, channelId,
    startGroupDM, addUser, userStatus
  } = useChat();
  const [tab, setTab] = useState<"friends"|"thread"|"search"|"files">("friends");
  const { show } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [groupMode, setGroupMode] = useState(false);
  const [groupSelected, setGroupSelected] = useState<Record<string, boolean>>({});
  const [addFriendOpen, setAddFriendOpen] = useState(false);

  const { root, replies } = useMemo(() => {
    if (!threadFor?.rootId) return { root: undefined, replies: [] as any[] };
    return getThread(threadFor.rootId);
  }, [threadFor, getThread]);
  const friends = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return Object.values(users)
      .filter(u => u.id !== me.id)
      .map(user => {
        const dmId = `dm:${user.id}`;
        const activity = channelActivity[dmId];
        const snippet = activity?.lastPreview;
        const typing = (typingUsers[dmId] || []).length > 0;
        const status = (userStatus[user.id] ?? "offline") as PresenceState;
        return {
          user,
          avatarUrl: user.avatarUrl,
          dmId,
          initials: user.name.split(/\s+/).map(part => part[0] ?? "").join("").slice(0, 2).toUpperCase(),
          snippet,
          unread: activity?.unreadCount ?? 0,
          mention: activity?.mentionCount ?? 0,
          typing,
          lastTs: activity?.lastMessageTs ?? 0,
          status,
          statusLabel: statusLabels[status],
        };
      })
      .filter(f => (term ? f.user.name.toLowerCase().includes(term) : true))
      .sort((a, b) => {
        if (a.mention !== b.mention) return b.mention - a.mention;
        if (a.unread !== b.unread) return b.unread - a.unread;
        if (a.lastTs !== b.lastTs) return b.lastTs - a.lastTs;
        return a.user.name.localeCompare(b.user.name);
      });
  }, [users, me.id, channelActivity, typingUsers, userStatus, searchTerm]);
  const selectedCount = useMemo(() => Object.values(groupSelected).filter(Boolean).length, [groupSelected]);
  const pins = pinnedByChannel[channelId] || [];
  const saved = savedByUser[me.id] || [];
  
  const handleToggleSelect = (userId: string) => {
    setGroupSelected(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleToggleGroupMode = () => {
    setGroupMode(prev => {
      if (prev) setGroupSelected({});
      return !prev;
    });
  };

  const handleCancelGroup = () => {
    setGroupMode(false);
    setGroupSelected({});
  };

  const handleStartGroup = () => {
    const picked = Object.entries(groupSelected)
      .filter(([, value]) => value)
      .map(([id]) => id);
    if (picked.length < 2) {
      show({ variant: "error", title: "선택 부족", description: "그룹 DM은 2명 이상 선택해야 합니다." });
      return;
    }
    const channelId = startGroupDM(picked);
    if (channelId) {
      show({ variant: "success", title: "그룹 DM 시작", description: "새 그룹 DM이 생성되었습니다." });
      window.dispatchEvent(new Event("chat:close-right"));
    }
    setGroupMode(false);
    setGroupSelected({});
  };

  const handleAddFriend = (name: string, status: PresenceState) => {
    const trimmed = name.trim();
    if (!trimmed) {
      show({ variant: "error", title: "이름 필요", description: "친구 이름을 입력해주세요." });
      return;
    }
    addUser(trimmed, status);
    show({ variant: "success", title: "친구 추가", description: `${trimmed} 님이 목록에 추가되었습니다.` });
    setAddFriendOpen(false);
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          <button
              className={`px-2 py-1 text-xs rounded border ${tab==='friends'?'bg-subtle/60 border-border':'border-transparent hover:border-border'}`}
              onClick={()=> setTab("friends")}
            title="Friends"
        >
          <Users size={14}/> Friends
        </button>
          <button
            className={`px-2 py-1 text-xs rounded border ${tab==='thread'?'bg-subtle/60 border-border':'border-transparent hover:border-border'}`}
            onClick={()=> setTab("thread")}
            title="Thread"
        >
          <CornerUpLeft size={14}/> Thread
        </button>
          <button
            className={`px-2 py-1 text-xs rounded border ${tab==='search'?'bg-subtle/60 border-border':'border-transparent hover:border-border'}`}
            onClick={()=> setTab("search")}
            title="Search"
        >
          <Search size={14}/> Search
        </button>
          <button
            className={`px-2 py-1 text-xs rounded border ${tab==='files'?'bg-subtle/60 border-border':'border-transparent hover:border-border'}`}
            onClick={()=> setTab("files")}
            title="Files"
        >
          <Images size={14}/> Files
        </button>
        <div className="ml-auto">
          <button className="p-1 rounded hover:bg-subtle/60" onClick={()=> closeThread()} aria-label="close"><X size={14}/></button>
        </div>
      </div>

      {/* Friends */}
      {tab === 'friends' && (
        <div className="flex-1 overflow-auto">
          <SectionTitle>친구 목록</SectionTitle>
          <div className="p-3 space-y-3">
            <div className="flex flex-col gap-2">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand/60"
                placeholder="이름으로 검색"
              />
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                    onClick={() => setAddFriendOpen(true)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-subtle/40 px-2.5 py-1.5 text-xs font-medium hover:bg-subtle/60"
                >
                  <UserPlus2 size={12} /> 친구 초대
                </button>
                <button
                  type="button"
                    onClick={handleToggleGroupMode}
                    className={clsx("inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border", groupMode ? "bg-brand/10 text-brand border-brand/40" : "bg-subtle/40 hover:bg-subtle/60")}
                >
                  <Users size={12} /> {groupMode ? "선택 취소" : "그룹 DM"}
                </button>
                {groupMode && (
                  <span className="text-muted">{selectedCount}명 선택됨</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {friends.length === 0 && (
                <div className="text-sm text-muted">아직 함께 대화할 친구가 없어요.</div>
              )}
              {friends.map(friend => (
                <FriendRow
                  key={friend.user.id}
                  name={friend.user.name}
                  initials={friend.initials}
                  avatarUrl={friend.avatarUrl}
                  snippet={friend.snippet}
                  unread={friend.unread}
                  mention={friend.mention}
                  typing={friend.typing}
                  active={channelId === friend.dmId}
                  status={friend.status}
                  statusLabel={friend.statusLabel}
                  selectable={groupMode}
                  selected={!!groupSelected[friend.user.id]}
                  onToggleSelect={() => handleToggleSelect(friend.user.id)}
                  onOpen={() => setChannel(friend.dmId)}
                />
              ))}
            </div>
            {groupMode && (
              <div className="flex items-center gap-2 border-t border-border pt-3">
                <button
                  type="button"
                    onClick={handleStartGroup}
                  disabled={selectedCount < 2}
                    className={clsx("rounded-md px-3 py-1.5 text-xs font-medium", selectedCount < 2 ? "bg-subtle text-muted cursor-not-allowed" : "bg-brand text-white hover:bg-brand/90")}
                >
                  그룹 DM 시작
                </button>
                <button
                  type="button"
                    onClick={handleCancelGroup}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-subtle/60"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Thread */}
      {tab === 'thread' && (
        <div className="flex-1 overflow-auto">
          <SectionTitle>Thread</SectionTitle>
          {!root && <div className="p-3 text-sm text-muted">왼쪽에서 메시지를 선택해 스레드를 엽니다.</div>}
          {root && (
            <div className="p-3 space-y-3">
              <div className="rounded-md border border-border bg-panel p-2">
                <div className="text-xs text-muted">{root.author} · {new Date(root.ts).toLocaleString()}</div>
                <div className="text-sm mt-1 whitespace-pre-wrap"><MarkdownText text={root.text}/></div>
                {extractUrls(root.text).map(u => <div key={u} className="mt-2"><LinkPreview url={u} /></div>)}
                <ReadBy userNames={(root.seenBy || []).filter(uid => uid !== me.id).map(uid => users[uid]?.name || uid)} />
                <div className="mt-2 flex items-center gap-1">
                  <EmojiPicker onPick={(e)=> toggleReaction(root.id, e)} />
                  <button className={`px-2 py-1 text-xs border border-border rounded ${pins.includes(root.id)?'bg-subtle/60':''}`} onClick={()=> togglePin(root.id)}><Pin size={12}/> Pin</button>
                  <button className={`px-2 py-1 text-xs border border-border rounded ${saved.includes(root.id)?'bg-subtle/60':''}`} onClick={()=> toggleSave(root.id)}><Bookmark size={12}/> Save</button>
                </div>
              </div>

              <div className="space-y-2">
                {replies.map(r => (
                  <div key={r.id} className="rounded-md border border-border p-2">
                    <div className="text-xs text-muted">{r.author} · {new Date(r.ts).toLocaleString()}</div>
                    <div className="text-sm mt-1 whitespace-pre-wrap"><MarkdownText text={r.text}/></div>
                    {extractUrls(r.text).map(u => <div key={u} className="mt-2"><LinkPreview url={u} /></div>)}
                    <ReadBy userNames={(r.seenBy || []).filter(uid => uid !== me.id).map(uid => users[uid]?.name || uid)} />
                    <div className="mt-2 flex items-center gap-1">
                      <EmojiPicker onPick={(e)=> toggleReaction(r.id, e)} />
                      <button className="px-2 py-1 text-xs border border-border rounded" onClick={()=> togglePin(r.id)}><Pin size={12}/> Pin</button>
                      <button className="px-2 py-1 text-xs border border-border rounded" onClick={()=> toggleSave(r.id)}><Bookmark size={12}/> Save</button>
                    </div>
                  </div>
                ))}
                {replies.length === 0 && (
                  <div className="text-sm text-muted border border-dashed border-border/60 rounded-md p-3">첫 번째 답글을 작성해보세요.</div>
                )}
              </div>

              <div className="pt-2 border-t border-border">
                <Composer onSend={(text, files)=> send(text, files, { parentId: root.id })} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      {tab === 'search' && (
        <div className="flex-1 overflow-auto">
          <SectionTitle>Search</SectionTitle>
          {React.createElement(require('./SearchPanel').default)}
        </div>
      )}

      {/* Files */}
      {tab === 'files' && (
        <div className="flex-1 overflow-auto">
          <SectionTitle>Files</SectionTitle>
          <FilesPanel />
        </div>
      )}
      </div>
      <AddFriendModal
        open={addFriendOpen}
        onClose={() => setAddFriendOpen(false)}
        onSubmit={handleAddFriend}
      />
  </>
  );
}
