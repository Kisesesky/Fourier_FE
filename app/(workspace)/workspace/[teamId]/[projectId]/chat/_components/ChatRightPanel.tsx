// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/ChatRightPanel.tsx
'use client';

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useChat } from "@/workspace/chat/_model/store";
import Composer from "./Composer";
import EmojiPicker from "./EmojiPicker";
import MarkdownText from "./MarkdownText";
import { Pin, Bookmark, X, Search, Info, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import ReadBy from "./ReadBy";
import LinkPreview, { extractUrls } from "./LinkPreview";
import { useToast } from "@/components/ui/Toast";

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
    <div className="flex items-center justify-between py-2 text-[10.5px] text-muted">
      <span>댓글 {repliesCount}개</span>
      <span>{lastReplyAt ? `최근 답글 ${formatMessageTimestamp(lastReplyAt)}` : "아직 답글이 없습니다"}</span>
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
export default function ChatRightPanel() {
  const {
    threadFor, closeThread, getThread, toggleReaction, togglePin, toggleSave,
    pinnedByChannel, savedByUser, me, users, send, channelId, messages, updateMessage, deleteMessage, restoreMessage
  } = useChat();
  const { show } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

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
  const [followed, setFollowed] = useState(true);
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

  const handleQuickEdit = (messageId: string, currentText: string) => {
    const next = window.prompt("메시지 수정", currentText || "");
    if (next == null) return;
    const trimmed = next.trim();
    if (!trimmed) return;
    updateMessage(messageId, { text: trimmed });
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

  return (
      <div className="flex h-full min-h-0 flex-1 flex-col bg-background/90">
        <div className="flex items-center gap-2 border-b border-border/70 bg-panel/80 px-3 py-2.5">
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
                <div className="group mt-2 flex gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-subtle/45">
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
                    <div className="mt-0.5 text-[14.5px] leading-[1.65] text-foreground whitespace-pre-wrap"><MarkdownText text={root.text}/></div>
                    {extractUrls(root.text).map(u => <div key={u} className="mt-2"><LinkPreview url={u} /></div>)}
                    <ThreadReactionPills reactions={root.reactions} meId={me.id} users={users} onToggle={(emoji) => toggleReaction(root.id, emoji)} />
                    <ReadBy userNames={(root.seenBy || []).filter(uid => uid !== me.id).map(uid => users[uid]?.name || uid)} />
                    <div className="mt-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                      <div className="flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-1">
                        {["😁", "😥", "👌", "🙏"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-subtle/60"
                            onClick={() => toggleReaction(root.id, emoji)}
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                        <EmojiPicker onPick={(e)=> toggleReaction(root.id, e)} panelSide="top" />
                      </div>
                      <button className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${pins.includes(root.id) ? 'text-amber-500' : 'text-muted'} hover:bg-subtle/60`} onClick={() => togglePin(root.id)} aria-label="고정"><Pin size={14}/></button>
                      <button className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${saved.includes(root.id) ? 'text-emerald-500' : 'text-muted'} hover:bg-subtle/60`} onClick={() => toggleSave(root.id)} aria-label="저장"><Bookmark size={14}/></button>
                      {root.authorId === me.id && (
                        <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60" onClick={() => handleQuickEdit(root.id, root.text || "")} aria-label="편집">
                          <Pencil size={14}/>
                        </button>
                      )}
                      {root.authorId === me.id && (
                        <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-rose-500 hover:bg-subtle/60" onClick={() => handleQuickDelete(root.id)} aria-label="삭제">
                          <Trash2 size={14}/>
                        </button>
                      )}
                      <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60" onClick={() => show({ title: "추가 메뉴", description: "스레드 추가 메뉴는 준비중입니다." })} aria-label="추가 메뉴">
                        <MoreHorizontal size={14}/>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 border-t border-border/70 pt-2">
                  <ThreadMeta repliesCount={replies.length} lastReplyAt={lastReplyAt} />
                  <div className="ml-auto flex items-center gap-2">
                    <ThreadParticipants authorIds={participantIds} users={users} />
                      <button
                      className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] text-muted hover:bg-subtle/60"
                      onClick={() => setFollowed((v) => !v)}
                    >
                      {followed ? "Following" : "Follow"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {root && (
          <div ref={repliesRef} className="flex-1 overflow-y-auto px-4 pb-3">
            <div className="space-y-2">
              {replies
                .filter(r => (searchTerm ? (r.text || "").toLowerCase().includes(searchTerm.toLowerCase()) : true))
                .map((r, idx, list) => {
                  const prev = list[idx - 1];
                  const showDivider = !prev || new Date(prev.ts).toDateString() !== new Date(r.ts).toDateString();
                  return (
                    <div key={r.id}>
                      {showDivider && <ThreadDayDivider ts={r.ts} />}
                      <div className="group flex gap-3 rounded-xl bg-background/45 px-3 py-2 transition-colors hover:bg-subtle/55">
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
                          <div className="mt-0.5 text-[14.5px] leading-[1.65] text-foreground whitespace-pre-wrap"><MarkdownText text={r.text}/></div>
                          {extractUrls(r.text).map(u => <div key={u} className="mt-2"><LinkPreview url={u} /></div>)}
                          <ThreadReactionPills reactions={r.reactions} meId={me.id} users={users} onToggle={(emoji) => toggleReaction(r.id, emoji)} />
                          <ReadBy userNames={(r.seenBy || []).filter(uid => uid !== me.id).map(uid => users[uid]?.name || uid)} />
                          <div className="mt-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                            <div className="flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-1">
                              {["😁", "😥", "👌", "🙏"].map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-subtle/60"
                                  onClick={() => toggleReaction(r.id, emoji)}
                                  title={emoji}
                                >
                                  {emoji}
                                </button>
                              ))}
                              <EmojiPicker onPick={(e)=> toggleReaction(r.id, e)} panelSide="top" />
                            </div>
                            <button className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${(pins.includes(r.id)) ? 'text-amber-500' : 'text-muted'} hover:bg-subtle/60`} onClick={() => togglePin(r.id)} aria-label="고정"><Pin size={14}/></button>
                            <button className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${(saved.includes(r.id)) ? 'text-emerald-500' : 'text-muted'} hover:bg-subtle/60`} onClick={() => toggleSave(r.id)} aria-label="저장"><Bookmark size={14}/></button>
                            {r.authorId === me.id && (
                              <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60" onClick={() => handleQuickEdit(r.id, r.text || "")} aria-label="편집">
                                <Pencil size={14}/>
                              </button>
                            )}
                            {r.authorId === me.id && (
                              <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-rose-500 hover:bg-subtle/60" onClick={() => handleQuickDelete(r.id)} aria-label="삭제">
                                <Trash2 size={14}/>
                              </button>
                            )}
                            <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60" onClick={() => show({ title: "추가 메뉴", description: "스레드 추가 메뉴는 준비중입니다." })} aria-label="추가 메뉴">
                              <MoreHorizontal size={14}/>
                            </button>
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
          <div className="border-t border-border/70 bg-gradient-to-t from-background via-background/95 to-background/75 px-3 py-2">
            <div className="rounded-xl bg-transparent">
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
      </div>
  );
}
