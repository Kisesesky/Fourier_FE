"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useChat } from "@/workspace/chat/_model/store";
import type { Msg } from "@/workspace/chat/_model/types";
import { MessageGroup } from "./MessageGroup";
import Composer from "./Composer";
import { useMessageSections } from "@/workspace/chat/_model/hooks/useMessageSections";
import { useToast } from "@/components/ui/Toast";

type ThreadItem = {
  channelId: string;
  channelName: string;
  rootId: string;
  lastTs: number;
  unread: number;
  lastPreview: string;
  lastAuthor?: string;
};

const MSGS_KEY = (id: string) => `fd.chat.messages:${id}`;

const summarize = (msg?: Msg) => {
  if (!msg) return "";
  if (msg.text?.trim()) return msg.text.trim().slice(0, 120);
  return "";
};

export default function ThreadsView() {
  const {
    channels,
    users,
    me,
    lastReadAt,
    channelActivity,
    setChannel,
    send,
    updateMessage,
    deleteMessage,
    restoreMessage,
    toggleReaction,
    togglePin,
    toggleSave,
    pinnedByChannel,
    savedByUser,
    openThread,
  } = useChat();
  const { show } = useToast();
  const listRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<{ channelId: string; rootId: string } | null>(null);
  const [threadMessages, setThreadMessages] = useState<Msg[]>([]);

  const threadItems = useMemo<ThreadItem[]>(() => {
    if (typeof window === "undefined") return [];
    const items: ThreadItem[] = [];
    const channelList = channels.filter((c) => !(c.isDM || c.id.startsWith("dm:")));
    channelList.forEach((channel) => {
      const raw = localStorage.getItem(MSGS_KEY(channel.id));
      if (!raw) return;
      let messages: Msg[] = [];
      try {
        messages = JSON.parse(raw) as Msg[];
      } catch {
        return;
      }
      const rootMap = new Map<string, Msg>();
      const repliesByRoot = new Map<string, Msg[]>();
      messages.forEach((m) => {
        if (!m.parentId) {
          rootMap.set(m.id, m);
          return;
        }
        const list = repliesByRoot.get(m.parentId) || [];
        list.push(m);
        repliesByRoot.set(m.parentId, list);
      });
      repliesByRoot.forEach((replies, rootId) => {
        const root = rootMap.get(rootId);
        if (!root) return;
        const last = [...replies].sort((a, b) => b.ts - a.ts)[0] ?? root;
        const unreadBase = lastReadAt[channel.id] || 0;
        const unread = replies.filter((r) => r.ts > unreadBase).length;
        items.push({
          channelId: channel.id,
          channelName: channel.name?.replace(/^#\s*/, "") || channel.id,
          rootId,
          lastTs: last.ts,
          unread,
          lastPreview: summarize(last),
          lastAuthor: last.author,
        });
      });
    });
    return items.sort((a, b) => b.lastTs - a.lastTs);
  }, [channels, lastReadAt, channelActivity]);

  const currentChannelName = useMemo(() => {
    if (!selected) return "";
    const channel = channels.find((c) => c.id === selected.channelId);
    return channel?.name?.replace(/^#\s*/, "") || selected.channelId;
  }, [channels, selected]);

  useEffect(() => {
    if (!selected) {
      setThreadMessages([]);
      return;
    }
    const raw = localStorage.getItem(MSGS_KEY(selected.channelId));
    if (!raw) {
      setThreadMessages([]);
      return;
    }
    try {
      const messages = JSON.parse(raw) as Msg[];
      const items = messages.filter((m) => m.id === selected.rootId || m.parentId === selected.rootId);
      items.sort((a, b) => a.ts - b.ts);
      setThreadMessages(items);
    } catch {
      setThreadMessages([]);
    }
  }, [selected, channelActivity]);

  useEffect(() => {
    if (!selected) return;
    void setChannel(selected.channelId);
  }, [selected, setChannel]);

  const lastReadTs = selected ? lastReadAt[selected.channelId] || 0 : 0;
  const { sections, otherSeen } = useMessageSections({
    messages: threadMessages,
    lastReadTs,
    meId: me.id,
    users,
  });
  const replyMetaMap = useMemo(() => {
    const map: Record<string, { count: number; lastTs?: number; lastAuthorId?: string }> = {};
    threadMessages.forEach((m) => {
      if (!m.parentId) return;
      const curr = map[m.parentId] || { count: 0 };
      const nextCount = curr.count + 1;
      const nextLastTs = !curr.lastTs || m.ts > curr.lastTs ? m.ts : curr.lastTs;
      const nextLastAuthorId = !curr.lastTs || m.ts > curr.lastTs ? m.authorId : curr.lastAuthorId;
      map[m.parentId] = { count: nextCount, lastTs: nextLastTs, lastAuthorId: nextLastAuthorId };
    });
    return map;
  }, [threadMessages]);

  const handleOpenThread = (channelId: string, rootId: string) => {
    setSelected({ channelId, rootId });
    openThread(rootId);
  };

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-border bg-panel/80 p-4 shadow-panel">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.3em] text-muted">Threads</div>
          <span className="text-[11px] text-muted">{threadItems.length} items</span>
        </div>
        <div className="mt-4 space-y-2">
          {threadItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-panel/60 p-4 text-xs text-muted">
              참여한 스레드가 없습니다.
            </div>
          ) : (
            threadItems.map((item) => {
              const unreadLabel = item.unread > 99 ? "99+" : item.unread > 0 ? String(item.unread) : "";
              const isActive = selected?.rootId === item.rootId;
              return (
                <button
                  key={`${item.channelId}:${item.rootId}`}
                  type="button"
                  className={`flex w-full flex-col gap-2 rounded-xl border px-4 py-3 text-left text-xs transition ${
                    isActive ? "border-border bg-accent text-foreground" : "border-border/60 bg-panel/70 text-muted hover:bg-accent"
                  }`}
                  onClick={() => handleOpenThread(item.channelId, item.rootId)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-foreground">#{item.channelName}</span>
                    {unreadLabel && (
                      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-500">
                        {unreadLabel}
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[11px] text-muted">
                    {item.lastPreview || "메시지 없음"}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted">
                    <span className="truncate">{item.lastAuthor ?? "알 수 없음"}</span>
                    <span>{new Date(item.lastTs).toLocaleString()}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>
      <section className="flex min-h-0 flex-col gap-3">
        <div className="rounded-2xl border border-border bg-panel/80 px-4 py-3 text-sm text-muted shadow-panel">
          {selected ? `#${currentChannelName} 스레드` : "스레드를 선택하세요"}
        </div>
        <div
          ref={listRef}
          className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border bg-panel/80 p-4"
        >
          {selected ? (
            sections.map((section) => (
              <div key={section.head.id} className="space-y-2">
                <MessageGroup
                  items={section.items}
                  isMine={section.head.authorId === me.id}
                  view="cozy"
                  meId={me.id}
                  otherSeen={otherSeen}
                  users={users}
                  threadMetaMap={replyMetaMap}
                  onEdit={(id, text) => updateMessage(id, { text })}
                  onDelete={(id) => {
                    const deleted = deleteMessage(id);
                    if (!deleted.deleted) return;
                    show({
                      title: "메시지를 삭제했습니다",
                      description: "되돌리려면 Undo를 누르세요.",
                      actionLabel: "Undo",
                      onAction: () => deleted.deleted && restoreMessage(deleted.deleted),
                    });
                  }}
                  onReact={(id, emoji) => toggleReaction(id, emoji)}
                  onReply={(rootId) => openThread(rootId)}
                  openMenu={() => {}}
                  onQuoteInline={() => {}}
                  selectable={false}
                  selectedIds={new Set()}
                  onToggleSelect={() => {}}
                  pinnedIds={new Set(pinnedByChannel[selected.channelId] || [])}
                  savedIds={new Set(savedByUser[me.id] || [])}
                  onPin={togglePin}
                  onSave={toggleSave}
                />
              </div>
            ))
          ) : (
            <div className="text-sm text-muted">왼쪽에서 스레드를 선택하세요.</div>
          )}
        </div>
        {selected && (
          <div className="rounded-2xl border border-border bg-panel/80 px-4 py-2">
            <Composer onSend={(text, files, extra) => send(text, files, { ...extra, parentId: selected.rootId })} />
          </div>
        )}
      </section>
    </div>
  );
}
