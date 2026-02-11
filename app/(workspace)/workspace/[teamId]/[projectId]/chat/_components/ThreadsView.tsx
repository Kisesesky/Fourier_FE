// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/ThreadsView.tsx
'use client';

import { useEffect, useMemo } from "react";
import { Check, Filter, Search } from "lucide-react";
import { useChat } from "@/workspace/chat/_model/store";
import MarkdownText from "./MarkdownText";
import Composer from "./Composer";
import { useThreadItems } from "@/workspace/chat/_model/hooks/useThreadItems";
import EmojiPicker from "./EmojiPicker";
import { useToast } from "@/components/ui/Toast";
import type { Msg } from "@/workspace/chat/_model/types";
import { useThreadsViewStore } from "@/workspace/chat/_model/store/useThreadsViewStore";

function ThreadHeader({ channelName }: { channelName: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px] text-muted">
      <span className="font-semibold text-foreground">#{channelName}</span>
    </div>
  );
}

function ReactionPills({
  msg,
  meId,
  onToggle,
}: {
  msg: Msg;
  meId: string;
  onToggle: (emoji: string) => void;
}) {
  const entries = Object.entries(msg.reactions || {});
  if (entries.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {entries.map(([emoji, users]) => {
        const reacted = users.includes(meId);
        return (
          <button
            key={emoji}
            className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] leading-none transition ${
              reacted ? "border-border bg-subtle/80 text-foreground" : "border-border bg-subtle/40 text-foreground hover:bg-subtle/60"
            }`}
            onClick={() => onToggle(emoji)}
            title={`${users.length}명`}
          >
            <span>{emoji}</span>
            {users.length > 0 && (
              <span className={reacted ? "text-background/80" : "text-muted"}>{users.length}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ThreadRow({
  msg,
  author,
  avatarUrl,
  isMine,
  editing,
  draft,
  onDraftChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onReact,
  meId,
}: {
  msg: Msg;
  author: string;
  avatarUrl?: string;
  isMine: boolean;
  editing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  meId: string;
}) {
  return (
    <div className="group flex gap-3">
      <div className="pt-0.5">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/20 text-[11px] font-semibold text-foreground">
          {avatarUrl ? (
            <img src={avatarUrl} alt={author} className="h-full w-full object-cover" />
          ) : (
            author.slice(0, 2).toUpperCase()
          )}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <span className="font-semibold text-foreground">{author}</span>
          <span>{new Date(msg.ts).toLocaleString()}</span>
        </div>
        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand/60"
            />
            <div className="flex items-center gap-2 text-xs">
              <button className="rounded-md border border-border px-2 py-1 hover:bg-subtle/60" onClick={onSaveEdit}>
                저장
              </button>
              <button className="rounded-md border border-border px-2 py-1 hover:bg-subtle/60" onClick={onCancelEdit}>
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-1 text-[14px] text-foreground">
            <MarkdownText text={msg.text || ""} />
          </div>
        )}
        <ReactionPills msg={msg} meId={meId} onToggle={onReact} />
        {!editing && (
          <div className="mt-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <EmojiPicker onPick={onReact} />
            {isMine && (
              <button className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted hover:text-foreground" onClick={onStartEdit}>
                Edit
              </button>
            )}
            {isMine && (
              <button className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted hover:text-foreground" onClick={onDelete}>
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ThreadsView() {
  const { channels, users, me, lastReadAt, send, setChannel, channelActivity, updateMessage, deleteMessage, restoreMessage, toggleReaction, channelId: activeChannelId } = useChat();
  const threadItems = useThreadItems({ channels, lastReadAt, meId: me.id, activityKey: channelActivity });
  const {
    sortMode,
    setSortMode,
    expanded,
    setExpanded,
    query,
    setQuery,
    searchMode,
    setSearchMode,
    editingId,
    setEditingId,
    draft,
    setDraft,
    selectedId,
    setSelectedId,
    filterOpen,
    setFilterOpen,
    resetThreadsViewState,
  } = useThreadsViewStore();
  const { show } = useToast();

  useEffect(() => {
    resetThreadsViewState();
  }, [resetThreadsViewState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncFromHash = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#thread-")) {
        setSelectedId(null);
        return;
      }
      const id = hash.replace("#thread-", "");
      setSelectedId(id);
      const el = document.getElementById(`thread-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    const handleSelect = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string | null }>).detail;
      if (!detail) return;
      if (!detail.id) {
        setSelectedId(null);
        return;
      }
      setSelectedId(detail.id);
      const el = document.getElementById(`thread-${detail.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("threads:select", handleSelect as EventListener);
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("threads:select", handleSelect as EventListener);
    };
  }, [threadItems.length]);


  const emptyLabel = useMemo(
    () => (threadItems.length ? "" : "참여한 스레드가 없습니다."),
    [threadItems.length],
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threadItems;
    return threadItems.filter((item) => {
      const rootAuthor = users[item.root.authorId]?.name || item.root.author || "";
      if (searchMode === "author") {
        const authorStack = [
          rootAuthor,
          ...item.replies.map((r) => users[r.authorId]?.name || r.author || ""),
        ]
          .join(" ")
          .toLowerCase();
        return authorStack.includes(q);
      }
      const contentStack = [
        item.channelName,
        item.root.text || "",
        ...item.replies.map((r) => r.text || ""),
      ]
        .join(" ")
        .toLowerCase();
      return contentStack.includes(q);
    });
  }, [query, threadItems, users, searchMode]);

  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    list.sort((a, b) => (sortMode === "recent" ? b.lastTs - a.lastTs : a.lastTs - b.lastTs));
    return list;
  }, [filteredItems, sortMode]);

  const visibleItems = useMemo(() => {
    if (!selectedId) return sortedItems;
    const direct = threadItems.find((item) => item.rootId === selectedId);
    if (!direct) return [];
    return [direct];
  }, [selectedId, sortedItems]);
  const selectThread = (rootId: string) => {
    if (typeof window !== "undefined") {
      window.location.hash = `thread-${rootId}`;
    }
    setSelectedId(rootId);
  };

  const ensureChannel = async (channelId: string) => {
    if (activeChannelId === channelId) return;
    await setChannel(channelId);
  };

  const renderThreadCard = (item: typeof visibleItems[number]) => {
    const root = item.root;
    const rootAuthor = users[root.authorId]?.name || root.author || "알 수 없음";
    const rootAvatar = users[root.authorId]?.avatarUrl;
    const isExpanded = expanded.has(item.rootId);
    const previewCount = 2;
    const visibleReplies = isExpanded ? item.replies : item.replies.slice(-previewCount);
    const hiddenCount = Math.max(0, item.replies.length - visibleReplies.length);

    return (
      <div
        key={`${item.channelId}:${item.rootId}`}
        id={`thread-${item.rootId}`}
        className="rounded-2xl border border-border bg-background/60 p-4 shadow-sm"
        role="button"
        tabIndex={0}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("button,textarea,input,a")) return;
          selectThread(item.rootId);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectThread(item.rootId);
          }
        }}
      >
        <ThreadHeader channelName={item.channelName} />
        <div className="mt-3 rounded-xl border border-border/70 bg-panel/70 p-3">
          <div className="mt-2">
            <ThreadRow
              msg={root}
              author={rootAuthor}
              avatarUrl={rootAvatar}
              isMine={root.authorId === me.id}
              editing={editingId === root.id}
              draft={editingId === root.id ? draft : root.text || ""}
              onDraftChange={setDraft}
              onStartEdit={() => {
                setEditingId(root.id);
                setDraft(root.text || "");
              }}
              onSaveEdit={() => {
                void (async () => {
                  await ensureChannel(item.channelId);
                  updateMessage(root.id, { text: draft.trim() });
                  setEditingId(null);
                })();
              }}
              onCancelEdit={() => setEditingId(null)}
              onDelete={() => {
                void (async () => {
                  await ensureChannel(item.channelId);
                  const deleted = deleteMessage(root.id);
                  if (!deleted.deleted) return;
                  show({
                    title: "메시지를 삭제했습니다",
                    description: "되돌리려면 Undo를 누르세요.",
                    actionLabel: "Undo",
                    onAction: () => deleted.deleted && restoreMessage(deleted.deleted),
                  });
                })();
              }}
              onReact={(emoji) => {
                void (async () => {
                  await ensureChannel(item.channelId);
                  toggleReaction(root.id, emoji);
                })();
              }}
              meId={me.id}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
          <span>댓글 {item.replies.length}개</span>
        </div>

        <div className="mt-3 space-y-3">
          {item.replies.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-panel/60 px-3 py-2 text-xs text-muted">
              첫 번째 답글을 남겨보세요.
            </div>
          ) : (
            visibleReplies.map((reply) => {
              const replyAuthor = users[reply.authorId]?.name || reply.author || "알 수 없음";
              const replyAvatar = users[reply.authorId]?.avatarUrl;
              return (
                <ThreadRow
                  key={reply.id}
                  msg={reply}
                  author={replyAuthor}
                  avatarUrl={replyAvatar}
                  isMine={reply.authorId === me.id}
                  editing={editingId === reply.id}
                  draft={editingId === reply.id ? draft : reply.text || ""}
                  onDraftChange={setDraft}
                  onStartEdit={() => {
                    setEditingId(reply.id);
                    setDraft(reply.text || "");
                  }}
                  onSaveEdit={() => {
                    void (async () => {
                      await ensureChannel(item.channelId);
                      updateMessage(reply.id, { text: draft.trim() });
                      setEditingId(null);
                    })();
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => {
                    void (async () => {
                      await ensureChannel(item.channelId);
                      const deleted = deleteMessage(reply.id);
                      if (!deleted.deleted) return;
                      show({
                        title: "메시지를 삭제했습니다",
                        description: "되돌리려면 Undo를 누르세요.",
                        actionLabel: "Undo",
                        onAction: () => deleted.deleted && restoreMessage(deleted.deleted),
                      });
                    })();
                  }}
                  onReact={(emoji) => {
                    void (async () => {
                      await ensureChannel(item.channelId);
                      toggleReaction(reply.id, emoji);
                    })();
                  }}
                  meId={me.id}
                />
              );
            })
          )}
        </div>
        {hiddenCount > 0 && !isExpanded && (
          <button
            type="button"
            className="mt-2 text-xs text-muted hover:text-foreground"
            onClick={() => {
              setExpanded((prev) => new Set(prev).add(item.rootId));
            }}
          >
            댓글 {hiddenCount}개 더 보기
          </button>
        )}
        {isExpanded && item.replies.length > previewCount && (
          <button
            type="button"
            className="mt-2 text-xs text-muted hover:text-foreground"
            onClick={() => {
              setExpanded((prev) => {
                const next = new Set(prev);
                next.delete(item.rootId);
                return next;
              });
            }}
          >
            접기
          </button>
        )}

        <div className="mt-4 rounded-xl border border-border bg-panel/70 px-3 py-2">
          <Composer
            onSend={async (text, files, extra) => {
              await setChannel(item.channelId);
              await send(text, files, { ...extra, parentId: item.rootId });
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border bg-panel/80">
        {!selectedId && (
          <div className="sticky top-0 z-10 border-b border-border bg-panel/90 px-4 py-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.32em] text-muted">Threads</div>
                <div className="mt-1 flex items-center gap-2 text-base font-semibold text-foreground">
                  <span>참여한 스레드</span>
                  <span className="rounded-full border border-border bg-subtle/60 px-2 py-0.5 text-[11px] text-muted">
                    {filteredItems.length}개
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full border border-border bg-panel/70 p-0.5">
                  <button
                    type="button"
                    className={`rounded-full px-2 py-0.5 text-[10px] ${searchMode === "content" ? "bg-foreground text-background" : "text-muted"}`}
                    onClick={() => setSearchMode("content")}
                  >
                    내용
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-2 py-0.5 text-[10px] ${searchMode === "author" ? "bg-foreground text-background" : "text-muted"}`}
                    onClick={() => setSearchMode("author")}
                  >
                    작성자
                  </button>
                </div>
                <div className="relative">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={searchMode === "author" ? "작성자 검색" : "내용 검색"}
                    className="h-8 w-44 rounded-full border border-border bg-background/70 pl-8 pr-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-brand/60"
                  />
                </div>
                <div className="relative">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-panel/70 text-muted hover:text-foreground"
                    onClick={() => setFilterOpen((prev) => !prev)}
                    aria-label="정렬 필터"
                    aria-expanded={filterOpen}
                    aria-haspopup="menu"
                  >
                    <Filter size={14} />
                  </button>
                  {filterOpen && (
                    <div className="absolute right-0 top-9 z-20 w-36 rounded-lg border border-border bg-panel/95 p-1 shadow-panel">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-muted hover:bg-subtle/70 hover:text-foreground"
                        onClick={() => {
                          setSortMode("recent");
                          setFilterOpen(false);
                        }}
                      >
                        <span>최신순</span>
                        {sortMode === "recent" && <Check size={12} className="text-foreground" />}
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-muted hover:bg-subtle/70 hover:text-foreground"
                        onClick={() => {
                          setSortMode("oldest");
                          setFilterOpen(false);
                        }}
                      >
                        <span>오래된순</span>
                        {sortMode === "oldest" && <Check size={12} className="text-foreground" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 p-4">
          {visibleItems.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/70 bg-panel/60 p-4 text-xs text-muted">
              {selectedId
                ? "해당 스레드를 찾을 수 없습니다."
                : query
                  ? "검색 결과가 없습니다."
                  : emptyLabel}
            </div>
          )}

          {visibleItems.map((item) => renderThreadCard(item))}
        </div>
      </div>
    </div>
  );
}
