// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/ChatRightPanel.tsx
'use client';

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useChat } from "@/workspace/chat/_model/store";
import type { PresenceState } from "@/workspace/chat/_model/types";
import Composer from "./Composer";
import MarkdownText from "./MarkdownText";
import {
  Pin,
  Bookmark,
  X,
  Search,
  Info,
  Pencil,
  Trash2,
  Users,
  SmilePlus,
  Reply,
  MoreHorizontal,
  Clock3,
  Smile,
  UserRound,
  PawPrint,
  UtensilsCrossed,
  Plane,
  Dumbbell,
  Laptop,
  AtSign,
  Flag,
} from "lucide-react";
import ReadBy from "./ReadBy";
import LinkPreview, { extractUrls } from "./LinkPreview";
import { useToast } from "@/components/ui/Toast";
import { imogiShortcuts } from "@/workspace/chat/_model/emoji.shortcuts";
const RECENT_EMOJI_KEY = "fd.chat.recentEmojis";
type EmojiCategoryKey = keyof typeof imogiShortcuts;
type EmojiTabKey = "recent" | EmojiCategoryKey;

function formatMessageTimestamp(ts: number) {
  const date = new Date(ts);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const meridiem = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 || 12;
  if (isToday) return `${meridiem} ${hour12}:${minute}`;
  return `${yyyy}. ${mm}. ${dd}. ${meridiem} ${hour12}:${minute}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="border-b border-border/70 px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-muted">{children}</div>;
}

function ThreadMeta({
  repliesCount,
  lastReplyAt,
}: {
  repliesCount: number;
  lastReplyAt?: number;
}) {
  return (
    <div className="flex items-center py-2 text-[10.5px] text-muted">
      <span className="rounded-full border border-border/70 bg-white px-2 py-0.5 text-[10px] font-bold text-sky-500">
        댓글 {repliesCount}개
      </span>
      <span className="ml-3">{lastReplyAt ? `최근 답글 ${formatMessageTimestamp(lastReplyAt)}` : "아직 답글이 없습니다"}</span>
    </div>
  );
}

function ThreadDayDivider({ ts }: { ts: number }) {
  const d = new Date(ts);
  const label = `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}`;
  return (
    <div className="flex items-center gap-2 py-2 text-[9px] text-muted/70">
      <div className="h-px flex-1 bg-border" />
      <span className="px-2 py-0.5">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function ThreadParticipants({
  authorIds,
  users,
}: {
  authorIds: string[];
  users: Record<string, { id: string; name: string; avatarUrl?: string }>;
}) {
  if (authorIds.length === 0) return null;
  return (
    <div className="flex items-center -space-x-2">
      {authorIds.slice(0, 5).map((id) => {
        const u = users[id];
        const label = u?.name || id;
        return (
          <div key={id} className="h-6 w-6 overflow-hidden rounded-full bg-muted/20 text-[10px] font-semibold text-foreground">
            {u?.avatarUrl ? (
              <img src={u.avatarUrl} alt={label} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                {label.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        );
      })}
      {authorIds.length > 5 && (
        <span className="ml-2 text-[10px] text-muted">+{authorIds.length - 5}</span>
      )}
    </div>
  );
}

function ThreadReactionPills({
  reactions,
  meId,
  users,
  onToggle,
}: {
  reactions?: Record<string, string[]>;
  meId: string;
  users: Record<string, { id: string; name: string; avatarUrl?: string }>;
  onToggle: (emoji: string) => void;
}) {
  const entries = Object.entries(reactions || {});
  if (entries.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {entries.map(([emoji, userIds]) => {
        const reacted = userIds.includes(meId);
        const who = userIds
          .map((id) => users[id]?.name || (id.startsWith("anon-") ? "익명" : id))
          .slice(0, 8);
        return (
          <div key={emoji} className="group/reaction relative">
            <button
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] leading-none transition ${
                reacted ? "border-border bg-subtle/85 text-foreground" : "border-border bg-subtle/45 text-foreground hover:bg-subtle/70"
              }`}
              onClick={() => onToggle(emoji)}
            >
              <span>{emoji}</span>
              <span className={`font-semibold ${reacted ? "text-background/80" : "text-muted"}`}>{userIds.length}</span>
            </button>
            <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-1 hidden min-w-36 rounded-md border border-border bg-panel px-2 py-1.5 text-[11px] text-muted shadow-lg group-hover/reaction:block">
              <div className="mb-0.5 text-foreground">{emoji} 반응</div>
              <div>{who.join(", ") || "사용자 없음"}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const emojiCategoryMeta: Array<{ key: EmojiTabKey; label: string; icon: React.ReactNode }> = [
  { key: "recent", label: "최근", icon: <Clock3 size={17} /> },
  { key: "Emotion", label: "감정", icon: <Smile size={17} /> },
  { key: "PeopleBodyRoles", label: "사람", icon: <UserRound size={17} /> },
  { key: "AnimalsAndNature", label: "동물/자연", icon: <PawPrint size={17} /> },
  { key: "FoodAndDrink", label: "음식", icon: <UtensilsCrossed size={17} /> },
  { key: "TravelAndPlaces", label: "여행", icon: <Plane size={17} /> },
  { key: "ActivitiesAndSports", label: "활동", icon: <Dumbbell size={17} /> },
  { key: "ObjectsAndTechnology", label: "사물", icon: <Laptop size={17} /> },
  { key: "SymbolsAndSigns", label: "기호", icon: <AtSign size={17} /> },
  { key: "Flags", label: "국기", icon: <Flag size={17} /> },
];

export default function ChatRightPanel({
  mode = "thread",
  memberIds = [],
  panelTitle = "멤버 목록",
}: {
  mode?: "thread" | "members";
  memberIds?: string[];
  panelTitle?: string;
}) {
  const {
    threadFor, closeThread, getThread, toggleReaction, togglePin, toggleSave,
    pinnedByChannel, savedByUser, me, users, userStatus, send, channelId, messages, updateMessage, deleteMessage, restoreMessage
  } = useChat();
  const { show } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [quickEmojiTarget, setQuickEmojiTarget] = useState<string | null>(null);
  const [emojiModalTarget, setEmojiModalTarget] = useState<string | null>(null);
  const [emojiModalQuery, setEmojiModalQuery] = useState("");
  const [emojiModalCategory, setEmojiModalCategory] = useState<EmojiTabKey>("recent");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const quickEmojis = ["😁", "😥", "👌", "👋", "🙏", "❤️", "✅"];
  const emojiAllEntries = useMemo(
    () =>
      emojiCategoryMeta
        .filter((meta): meta is { key: EmojiCategoryKey; label: string; icon: React.ReactNode } => meta.key !== "recent")
        .flatMap((meta) =>
          Object.entries(imogiShortcuts[meta.key]).map(([emoji, shortcut]) => ({
            category: meta.key,
            emoji,
            shortcut,
          })),
        ),
    [],
  );
  const emojiModalEntries = useMemo(() => {
    const keyword = emojiModalQuery.trim().toLowerCase();
    if (!keyword) {
      if (emojiModalCategory === "recent") {
        return recentEmojis.map((emoji) => ({
          category: "recent" as const,
          emoji,
          shortcut: "",
        }));
      }
      return Object.entries(imogiShortcuts[emojiModalCategory]).map(([emoji, shortcut]) => ({
        category: emojiModalCategory,
        emoji,
        shortcut,
      }));
    }
    const normalized = keyword.startsWith("/") ? keyword : `/${keyword}`;
    return emojiAllEntries.filter(({ emoji, shortcut }) =>
      emoji.includes(keyword) ||
      shortcut.toLowerCase().includes(keyword) ||
      shortcut.toLowerCase().includes(normalized),
    );
  }, [emojiAllEntries, emojiModalCategory, emojiModalQuery, recentEmojis]);

  const { root, replies } = useMemo(() => {
    if (!threadFor?.rootId) return { root: undefined, replies: [] as any[] };
    return getThread(threadFor.rootId);
  }, [threadFor, getThread, messages]);
  const pins = pinnedByChannel[channelId] || [];
  const saved = savedByUser[me.id] || [];
  const lastReplyAt = replies.length ? replies[replies.length - 1].ts : undefined;
  const participantIds = useMemo(() => {
    const ids = new Set<string>();
    if (root?.authorId) ids.add(root.authorId);
    replies.forEach((r) => ids.add(r.authorId));
    return Array.from(ids);
  }, [root?.authorId, replies]);
  const repliesRef = useRef<HTMLDivElement | null>(null);
  const openUserProfile = (
    userId: string,
    anchorRect?: { top: number; left: number; right: number; bottom: number },
  ) => {
    window.dispatchEvent(new CustomEvent("chat:open-user-profile", { detail: { userId, anchorRect } }));
  };

  useEffect(() => {
    if (!repliesRef.current) return;
    repliesRef.current.scrollTop = repliesRef.current.scrollHeight;
  }, [replies.length]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(RECENT_EMOJI_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const next = parsed.filter((v) => typeof v === "string").slice(0, 12);
        setRecentEmojis(next);
        if (next.length > 0) setEmojiModalCategory("recent");
      }
    } catch {
      // ignore malformed cache
    }
  }, []);
  useEffect(() => {
    if (!emojiModalTarget) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEmojiModalTarget(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [emojiModalTarget]);
  const focusThreadComposer = () => {
    setTimeout(() => {
      const target = repliesRef.current?.parentElement?.querySelector("textarea, [contenteditable='true']") as HTMLElement | null;
      target?.focus();
    }, 0);
  };
  const handleStartEdit = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId);
    setEditingDraft(currentText || "");
    setQuickEmojiTarget(null);
  };
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingDraft("");
  };
  const handleSaveEdit = (messageId: string) => {
    const trimmed = editingDraft.trim();
    if (!trimmed) return;
    updateMessage(messageId, { text: trimmed });
    setEditingMessageId(null);
    setEditingDraft("");
    show({ variant: "success", title: "메시지 수정", description: "메시지가 수정되었습니다." });
  };

  const handleQuickDelete = (messageId: string) => {
    const { deleted } = deleteMessage(messageId);
    if (!deleted) {
      show({ variant: "error", title: "삭제 불가", description: "자신이 작성한 메시지만 삭제할 수 있습니다." });
      return;
    }
    show({
      title: "메시지를 삭제했습니다",
      description: "되돌리려면 Undo를 누르세요.",
      actionLabel: "Undo",
      onAction: () => restoreMessage(deleted),
    });
  };
  const handlePickEmojiFromModal = (emoji: string) => {
    if (!emojiModalTarget) return;
    toggleReaction(emojiModalTarget, emoji);
    setRecentEmojis((prev) => {
      const next = [emoji, ...prev.filter((item) => item !== emoji)].slice(0, 12);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(RECENT_EMOJI_KEY, JSON.stringify(next));
      }
      return next;
    });
    setEmojiModalTarget(null);
    setQuickEmojiTarget(null);
  };

  if (mode === "members") {
    const getStatusMeta = (status?: PresenceState) => {
      switch (status) {
        case "online":
          return { label: "온라인", dotClass: "bg-emerald-500" };
        case "away":
        case "busy":
          return { label: "자리비움", dotClass: "bg-amber-500" };
        default:
          return { label: "오프라인", dotClass: "bg-slate-400" };
      }
    };
    const resolvedMembers = memberIds
      .map((id) => users[id] || { id, name: id, avatarUrl: undefined })
      .sort((a, b) => a.name.localeCompare(b.name));
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-x-hidden bg-background/90">
        <div className="flex items-center gap-2 border-b border-border/70 bg-panel/80 px-3 py-3">
          <div className="flex py-1 items-center gap-2 text-sm font-semibold text-foreground">
            <Users size={14} className="text-muted" />
            {panelTitle}
          </div>
          <span className="rounded-full border border-border bg-subtle/60 px-2 py-0.5 text-[10px] text-muted">
            {resolvedMembers.length}
          </span>
          <div className="ml-auto">
            <button
              className="rounded-lg p-1 hover:bg-subtle/60"
              onClick={() => {
                window.dispatchEvent(new Event("chat:close-right"));
              }}
              aria-label="close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {resolvedMembers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted">멤버가 없습니다.</div>
          ) : (
            <div className="space-y-1.5">
              {resolvedMembers.map((member) => {
                const isMe = member.id === me.id;
                const statusMeta = isMe ? getStatusMeta("online") : getStatusMeta(userStatus[member.id]);
                return (
                <button
                  key={member.id}
                  type="button"
                  onClick={(event) => openUserProfile(member.id, event.currentTarget.getBoundingClientRect())}
                  className="flex w-full items-center gap-2 rounded-xl bg-background/40 px-3 py-2 text-left transition-colors hover:bg-slate-500/20"
                >
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-muted/20 text-[10px] font-semibold text-foreground">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        {member.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="truncate text-sm font-semibold text-foreground">{member.name}</div>
                      {isMe && (
                        <span className="rounded-full bg-sky-500/15 px-2 text-[10px] font-semibold text-sky-600">
                          ME
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] text-muted">
                      <span className={`h-2 w-2 rounded-full ${statusMeta.dotClass}`} />
                      {statusMeta.label}
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-x-hidden bg-background/90">
        <div className="flex items-center gap-2 border-b border-border/70 bg-panel/80 px-3 py-3">
          <div className="flex py-1 items-center gap-2 text-sm font-semibold text-foreground">
            <Info size={14} className="text-muted" />
            스레드
          </div>
          <div className="ml-auto">
            <button
              className="rounded-lg p-1 hover:bg-subtle/60"
              onClick={() => {
                closeThread();
                window.dispatchEvent(new Event("chat:close-right"));
              }}
              aria-label="close"
            >
              <X size={14}/>
            </button>
          </div>
        </div>
        <div className="border-b border-border/70 bg-background/60 px-4 py-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-border/70 bg-background/90 py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand/60"
              placeholder="Search in thread"
            />
          </div>
        </div>
        <div className="flex flex-col">
          <SectionTitle>Replies</SectionTitle>
          {!root && <div className="p-4 text-sm text-muted">메시지에서 Reply를 눌러 스레드를 엽니다.</div>}
          {root && (
            <div className="px-4 py-2 space-y-2">
              <div className="rounded-xl border border-border/70 bg-background/50 p-3">
                <div className="text-[10.5px] uppercase tracking-[0.22em] text-muted">원본 메시지</div>
                <div
                  className="group/message relative mt-2 flex gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-subtle/45"
                  onMouseLeave={() => setQuickEmojiTarget(null)}
                >
                  <div className="pt-0.5">
                    <button
                      type="button"
                      className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted/20 text-[12px] font-semibold text-foreground"
                      onClick={(event) => openUserProfile(root.authorId, event.currentTarget.getBoundingClientRect())}
                      aria-label={`${root.author} 프로필 보기`}
                    >
                      {users[root.authorId]?.avatarUrl ? (
                        <img
                          src={users[root.authorId]?.avatarUrl}
                          alt={root.author}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (root.author || '?').slice(0, 2).toUpperCase()
                      )}
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[13px]">
                      <button
                        type="button"
                        className="font-semibold text-foreground/95 hover:underline"
                        onClick={(event) => openUserProfile(root.authorId, event.currentTarget.getBoundingClientRect())}
                      >
                        {root.author}
                      </button>
                      <span className="text-[10.5px] tracking-wide text-muted">{formatMessageTimestamp(root.ts)}</span>
                    </div>
                    {editingMessageId === root.id ? (
                      <div className="mt-1 space-y-2">
                        <textarea
                          value={editingDraft}
                          onChange={(e) => setEditingDraft(e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand/60"
                        />
                        <div className="flex items-center gap-2 text-xs">
                          <button className="rounded-md border border-border px-2 py-1 hover:bg-subtle/60" onClick={() => handleSaveEdit(root.id)}>저장</button>
                          <button className="rounded-md border border-border px-2 py-1 hover:bg-subtle/60" onClick={handleCancelEdit}>취소</button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-0.5 break-words whitespace-pre-wrap text-[14.5px] leading-[1.65] text-foreground">
                        <MarkdownText text={root.text}/>
                      </div>
                    )}
                    {extractUrls(root.text).map(u => <div key={u} className="mt-2"><LinkPreview url={u} /></div>)}
                    <ThreadReactionPills reactions={root.reactions} meId={me.id} users={users} onToggle={(emoji) => toggleReaction(root.id, emoji)} />
                    <ReadBy userNames={(root.seenBy || []).filter(uid => uid !== me.id).map(uid => users[uid]?.name || uid)} />
                    <div className="absolute right-2 top-1 z-10 flex items-center gap-0.5 rounded-lg border border-border bg-background px-1 py-0.5 opacity-0 shadow-lg transition group-hover/message:opacity-100 group-focus-within/message:opacity-100">
                      <div className="relative">
                        <button
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
                          onClick={() => setQuickEmojiTarget((prev) => (prev === root.id ? null : root.id))}
                          aria-label="퀵 이모지"
                          title="퀵 이모지"
                        >
                          <SmilePlus size={16} />
                        </button>
                        {quickEmojiTarget === root.id && (
                          <div className="absolute bottom-full right-0 mb-1 flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-1 shadow-lg">
                            {quickEmojis.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                className="inline-flex h-7 w-7 items-center justify-center rounded text-base hover:bg-subtle/60"
                                onClick={() => {
                                  toggleReaction(root.id, emoji);
                                  setQuickEmojiTarget(null);
                                }}
                                title={emoji}
                              >
                                {emoji}
                              </button>
                            ))}
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center rounded text-base hover:bg-subtle/60"
                              onClick={() => setEmojiModalTarget(root.id)}
                              aria-label="이모지 더보기"
                              title="이모지 더보기"
                            >
                              <MoreHorizontal size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                      <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60" onClick={focusThreadComposer} aria-label="답장" title="답장"><Reply size={14}/></button>
                      <button className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${pins.includes(root.id) ? 'text-amber-500' : 'text-muted'} hover:bg-subtle/60`} onClick={() => togglePin(root.id)} aria-label="고정" title="고정"><Pin size={14}/></button>
                      <button className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${saved.includes(root.id) ? 'text-emerald-500' : 'text-muted'} hover:bg-subtle/60`} onClick={() => toggleSave(root.id)} aria-label="저장" title="저장"><Bookmark size={14}/></button>
                      {root.authorId === me.id && <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60" onClick={() => handleStartEdit(root.id, root.text || "")} aria-label="편집" title="편집"><Pencil size={14}/></button>}
                      {root.authorId === me.id && <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-rose-500 hover:bg-subtle/60" onClick={() => handleQuickDelete(root.id)} aria-label="삭제" title="삭제"><Trash2 size={14}/></button>}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 border-t border-border/70 pt-2">
                  <ThreadMeta repliesCount={replies.length} lastReplyAt={lastReplyAt} />
                  <div className="ml-auto flex items-center gap-2">
                    <ThreadParticipants authorIds={participantIds} users={users} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {root && (
          <div ref={repliesRef} className="flex-1 overflow-y-auto px-4 pb-1">
            <div className="space-y-2">
              {replies
                .filter(r => (searchTerm ? (r.text || "").toLowerCase().includes(searchTerm.toLowerCase()) : true))
                .map((r, idx, list) => {
                  const prev = list[idx - 1];
                  const showDivider = !prev || new Date(prev.ts).toDateString() !== new Date(r.ts).toDateString();
                  return (
                    <div key={r.id}>
                      {showDivider && <ThreadDayDivider ts={r.ts} />}
                      <div
                        className="group/message relative flex gap-3 rounded-xl bg-background/45 px-3 py-2 transition-colors hover:bg-subtle/55"
                        onMouseLeave={() => setQuickEmojiTarget(null)}
                      >
                        <div className="pt-0.5">
                          <button
                            type="button"
                            className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted/20 text-[12px] font-semibold text-foreground"
                            onClick={(event) => openUserProfile(r.authorId, event.currentTarget.getBoundingClientRect())}
                            aria-label={`${r.author} 프로필 보기`}
                          >
                            {users[r.authorId]?.avatarUrl ? (
                              <img
                                src={users[r.authorId]?.avatarUrl}
                                alt={r.author}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              (r.author || '?').slice(0, 2).toUpperCase()
                            )}
                          </button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 text-[13px]">
                            <button
                              type="button"
                              className="font-semibold text-foreground/95 hover:underline"
                              onClick={(event) => openUserProfile(r.authorId, event.currentTarget.getBoundingClientRect())}
                            >
                              {r.author}
                            </button>
                            <span className="text-[10.5px] tracking-wide text-muted">{formatMessageTimestamp(r.ts)}</span>
                          </div>
                          {editingMessageId === r.id ? (
                            <div className="mt-1 space-y-2">
                              <textarea
                                value={editingDraft}
                                onChange={(e) => setEditingDraft(e.target.value)}
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand/60"
                              />
                              <div className="flex items-center gap-2 text-xs">
                                <button className="rounded-md border border-border px-2 py-1 hover:bg-subtle/60" onClick={() => handleSaveEdit(r.id)}>저장</button>
                                <button className="rounded-md border border-border px-2 py-1 hover:bg-subtle/60" onClick={handleCancelEdit}>취소</button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-0.5 break-words whitespace-pre-wrap text-[14.5px] leading-[1.65] text-foreground">
                              <MarkdownText text={r.text}/>
                            </div>
                          )}
                          {extractUrls(r.text).map(u => <div key={u} className="mt-2"><LinkPreview url={u} /></div>)}
                          <ThreadReactionPills reactions={r.reactions} meId={me.id} users={users} onToggle={(emoji) => toggleReaction(r.id, emoji)} />
                          <ReadBy userNames={(r.seenBy || []).filter(uid => uid !== me.id).map(uid => users[uid]?.name || uid)} />
                          <div className="absolute right-2 top-1 z-10 flex items-center gap-0.5 rounded-lg border border-border bg-background px-1 py-0.5 opacity-0 shadow-lg transition group-hover/message:opacity-100 group-focus-within/message:opacity-100">
                            <div className="relative">
                              <button
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
                                onClick={() => setQuickEmojiTarget((prev) => (prev === r.id ? null : r.id))}
                                aria-label="퀵 이모지"
                                title="퀵 이모지"
                              >
                                <SmilePlus size={16} />
                              </button>
                              {quickEmojiTarget === r.id && (
                                <div className="absolute bottom-full right-0 mb-1 flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-1 shadow-lg">
                                  {quickEmojis.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      className="inline-flex h-7 w-7 items-center justify-center rounded text-base hover:bg-subtle/60"
                                      onClick={() => {
                                        toggleReaction(r.id, emoji);
                                        setQuickEmojiTarget(null);
                                      }}
                                      title={emoji}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    className="inline-flex h-7 w-7 items-center justify-center rounded text-base hover:bg-subtle/60"
                                    onClick={() => setEmojiModalTarget(r.id)}
                                    aria-label="이모지 더보기"
                                    title="이모지 더보기"
                                  >
                                    <MoreHorizontal size={15} />
                                  </button>
                                </div>
                              )}
                            </div>
                            <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60" onClick={focusThreadComposer} aria-label="답장" title="답장"><Reply size={14}/></button>
                            <button className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${(pins.includes(r.id)) ? 'text-amber-500' : 'text-muted'} hover:bg-subtle/60`} onClick={() => togglePin(r.id)} aria-label="고정" title="고정"><Pin size={14}/></button>
                            <button className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${(saved.includes(r.id)) ? 'text-emerald-500' : 'text-muted'} hover:bg-subtle/60`} onClick={() => toggleSave(r.id)} aria-label="저장" title="저장"><Bookmark size={14}/></button>
                            {r.authorId === me.id && <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60" onClick={() => handleStartEdit(r.id, r.text || "")} aria-label="편집" title="편집"><Pencil size={14}/></button>}
                            {r.authorId === me.id && <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-rose-500 hover:bg-subtle/60" onClick={() => handleQuickDelete(r.id)} aria-label="삭제" title="삭제"><Trash2 size={14}/></button>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {replies.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/60 p-3 text-sm text-muted">첫 번째 답글을 작성해보세요.</div>
              )}
            </div>
          </div>
        )}
        {root && (
          <div className="border-t border-border/70 bg-gradient-to-t from-background via-background/95 to-background/75 px-2">
            <div className="bg-transparent">
              <Composer
                placeholder="스레드에 답장 보내기"
                onSend={(text, files)=> {
                  void send(text, files, { parentId: root.id }).catch(() => {
                    show({ variant: "error", title: "스레드 전송 실패", description: "잠시 후 다시 시도해주세요." });
                  });
                }}
              />
            </div>
          </div>
        )}
        {emojiModalTarget && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 px-4" onClick={() => setEmojiModalTarget(null)}>
            <div
              className="w-full max-w-2xl rounded-2xl border border-border bg-panel p-4 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">이모지 선택</h3>
                <button
                  type="button"
                  className="rounded-md p-1 text-muted hover:bg-subtle/60"
                  onClick={() => setEmojiModalTarget(null)}
                  aria-label="close"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="mb-2 flex items-center gap-1 rounded border border-border bg-subtle/40 px-2 py-1">
                <Search size={12} className="opacity-70" />
                <input
                  autoFocus
                  placeholder="이모지 또는 /기쁨 검색"
                  className="flex-1 bg-transparent text-xs outline-none"
                  value={emojiModalQuery}
                  onChange={(e) => setEmojiModalQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-border pr-2">
                  {emojiCategoryMeta.map((meta) => (
                    <button
                      key={meta.key}
                      type="button"
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${
                        emojiModalCategory === meta.key ? "bg-brand text-white" : "text-muted hover:bg-subtle/70"
                      }`}
                      onClick={() => setEmojiModalCategory(meta.key)}
                      title={meta.label}
                    >
                      {meta.icon}
                    </button>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  {emojiModalCategory === "recent" && recentEmojis.length === 0 && !emojiModalQuery.trim() ? (
                    <div className="py-8 text-center text-xs text-muted">최근 사용한 이모지가 없습니다.</div>
                  ) : (
                    <div className="max-h-[24rem] overflow-y-auto">
                      <div className="grid grid-cols-8 gap-0">
                        {emojiModalEntries.map(({ emoji, shortcut }, index) => (
                          <button
                            key={`${emoji}-${index}`}
                            type="button"
                            className="inline-flex h-12 items-center justify-center rounded-none text-[30px] leading-none transition-colors hover:bg-brand/20"
                            onClick={() => handlePickEmojiFromModal(emoji)}
                            aria-label={shortcut}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
