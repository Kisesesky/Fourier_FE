// components/chat/ChatRightPanel.tsx
'use client';

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useChat } from "@/workspace/chat/_model/store";
import Composer from "./Composer";
import EmojiPicker from "./EmojiPicker";
import MarkdownText from "./MarkdownText";
import { CornerUpLeft, Pin, Bookmark, X, Search, Info } from "lucide-react";
import clsx from "clsx";
import ReadBy from "./ReadBy";
import LinkPreview, { extractUrls } from "./LinkPreview";
import { useToast } from "@/components/ui/Toast";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-muted border-b border-border">{children}</div>;
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
      <span>{lastReplyAt ? `최근 답글 · ${new Date(lastReplyAt).toLocaleString()}` : "아직 답글이 없습니다"}</span>
    </div>
  );
}

function ThreadDayDivider({ ts }: { ts: number }) {
  const d = new Date(ts);
  const label = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  return (
    <div className="flex items-center gap-2 py-2 text-[10.5px] text-muted">
      <div className="h-px flex-1 bg-border" />
      <span className="rounded-full border border-border bg-panel px-2 py-0.5">{label}</span>
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
          <div key={id} className="h-6 w-6 overflow-hidden rounded-full border border-border bg-muted/20 text-[10px] font-semibold text-foreground">
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
export default function ChatRightPanel() {
  const {
    threadFor, closeThread, getThread, toggleReaction, togglePin, toggleSave,
    pinnedByChannel, savedByUser, me, users, send, channelId, messages
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

  useEffect(() => {
    if (!repliesRef.current) return;
    repliesRef.current.scrollTop = repliesRef.current.scrollHeight;
  }, [replies.length]);

  return (
      <div className="flex h-full min-h-0 flex-1 flex-col bg-panel/80">
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 bg-panel/80">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Info size={14} className="text-muted" />
            스레드
          </div>
          <div className="ml-auto">
            <button
              className="p-1 rounded hover:bg-subtle/60"
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
        <div className="px-4 py-2 border-b border-border">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-border bg-background/80 pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand/60"
              placeholder="Search in thread"
            />
          </div>
        </div>
        <div className="flex flex-col">
          <SectionTitle>Replies</SectionTitle>
          {!root && <div className="p-4 text-sm text-muted">메시지에서 Reply를 눌러 스레드를 엽니다.</div>}
          {root && (
            <div className="px-4 py-2 space-y-2">
              <div className="pb-3 border-b border-border">
                <div className="text-[10.5px] uppercase tracking-[0.22em] text-muted">원본 메시지</div>
                <div className="group mt-2 flex gap-3">
                  <div className="pt-0.5">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/20 text-[12px] font-semibold text-foreground">
                      {users[root.authorId]?.avatarUrl ? (
                        <img
                          src={users[root.authorId]?.avatarUrl}
                          alt={root.author}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (root.author || '?').slice(0, 2).toUpperCase()
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-muted flex items-center gap-1">
                      <span>{root.author}</span>
                      <span>· {new Date(root.ts).toLocaleString()}</span>
                    </div>
                    <div className="text-[14.5px] mt-2 whitespace-pre-wrap"><MarkdownText text={root.text}/></div>
                    {extractUrls(root.text).map(u => <div key={u} className="mt-2"><LinkPreview url={u} /></div>)}
                    <ReadBy userNames={(root.seenBy || []).filter(uid => uid !== me.id).map(uid => users[uid]?.name || uid)} />
                    <div className="mt-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                      <EmojiPicker onPick={(e)=> toggleReaction(root.id, e)} />
                      <button className={`px-2 py-1 text-xs border border-border rounded-full ${pins.includes(root.id)?'bg-subtle/60':''}`} onClick={()=> togglePin(root.id)}><Pin size={12}/> Pin</button>
                      <button className={`px-2 py-1 text-xs border border-border rounded-full ${saved.includes(root.id)?'bg-subtle/60':''}`} onClick={()=> toggleSave(root.id)}><Bookmark size={12}/> Save</button>
                    </div>
                  </div>
                </div>
                <div className="mt-1 border-t border-border pt-1 flex items-center gap-3">
                  <ThreadMeta repliesCount={replies.length} lastReplyAt={lastReplyAt} />
                  <div className="ml-auto flex items-center gap-2">
                    <ThreadParticipants authorIds={participantIds} users={users} />
                    <button
                      className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted hover:bg-subtle/60"
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
            <div className="space-y-1 border-l-2 border-brand/30 pl-3">
              {replies
                .filter(r => (searchTerm ? (r.text || "").toLowerCase().includes(searchTerm.toLowerCase()) : true))
                .map((r, idx, list) => {
                  const prev = list[idx - 1];
                  const showDivider = !prev || new Date(prev.ts).toDateString() !== new Date(r.ts).toDateString();
                  return (
                    <div key={r.id}>
                      {showDivider && <ThreadDayDivider ts={r.ts} />}
                      <div className="group flex gap-3 py-1">
                        <div className="pt-0.5">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/20 text-[12px] font-semibold text-foreground">
                            {users[r.authorId]?.avatarUrl ? (
                              <img
                                src={users[r.authorId]?.avatarUrl}
                                alt={r.author}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              (r.author || '?').slice(0, 2).toUpperCase()
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] text-muted flex items-center gap-1">
                            <span>{r.author}</span>
                            <span>· {new Date(r.ts).toLocaleString()}</span>
                          </div>
                          <div className="text-[14.5px] mt-2 whitespace-pre-wrap"><MarkdownText text={r.text}/></div>
                          {extractUrls(r.text).map(u => <div key={u} className="mt-2"><LinkPreview url={u} /></div>)}
                          <ReadBy userNames={(r.seenBy || []).filter(uid => uid !== me.id).map(uid => users[uid]?.name || uid)} />
                          <div className="mt-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                            <EmojiPicker onPick={(e)=> toggleReaction(r.id, e)} />
                            <button className="px-2 py-1 text-xs border border-border rounded-full" onClick={()=> togglePin(r.id)}><Pin size={12}/> Pin</button>
                            <button className="px-2 py-1 text-xs border border-border rounded-full" onClick={()=> toggleSave(r.id)}><Bookmark size={12}/> Save</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {replies.length === 0 && (
                <div className="text-sm text-muted border border-dashed border-border/60 rounded-md p-3">첫 번째 답글을 작성해보세요.</div>
              )}
            </div>
          </div>
        )}
        {root && (
          <div className="border-t border-border bg-panel/80 p-3">
            <div className="border border-border bg-panel/70 p-2 rounded-md">
              <Composer
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
