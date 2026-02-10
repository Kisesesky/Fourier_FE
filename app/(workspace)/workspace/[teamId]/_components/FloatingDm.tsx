// app/(workspace)/workspace/[teamId]/_components/FloatingDm.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, Search, Send, Smile } from "lucide-react";
import Modal from "@/components/common/Modal";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { fetchFriends, type FriendProfile } from "@/lib/members";
import { createDmRoom, fetchDmMessages, sendDmMessage, type DmMessage } from "@/lib/chat";
import { getChatSocket } from "@/lib/socket";
import DmListView from "./floating-dm/DmListView";
import FloatingLauncher from "./floating-dm/FloatingLauncher";
import {
  FLOATING_DM_EMOJIS,
  FLOATING_DM_FILE_TYPE_OPTIONS,
  FLOATING_DM_STORAGE_KEYS,
} from "./floating-dm/floating-dm.constants";
import {
  getFloatingDmInitials,
  getFloatingDmMessageTimeLabel,
  getFloatingDmRelativeDateLabel,
} from "./floating-dm/floating-dm.utils";

export default function FloatingDm() {
  const { workspace } = useWorkspace();
  const { profile } = useAuthProfile();
  const [open, setOpen] = useState(false);
  const [floatingHidden, setFloatingHidden] = useState(false);
  const [floatingPos, setFloatingPos] = useState<{ x: number; y: number } | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 });
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [selected, setSelected] = useState<FriendProfile | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [recentByFriend, setRecentByFriend] = useState<Record<string, { preview: string; at: string }>>({});
  const [unreadByFriend, setUnreadByFriend] = useState<Record<string, number>>({});
  const canSend = draft.trim().length > 0 && !!roomId;
  const [view, setView] = useState<"list" | "chat">("list");
  const [, setLastReadAt] = useState<Record<string, string>>({});
  const [replyTarget, setReplyTarget] = useState<DmMessage | null>(null);
  const [emojiOpenFor, setEmojiOpenFor] = useState<string | null>(null);
  const [inputEmojiOpen, setInputEmojiOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailSearchOpen, setDetailSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const [detailKeyword, setDetailKeyword] = useState("");
  const [detailDate, setDetailDate] = useState("");
  const [detailFileType, setDetailFileType] = useState("");
  const [detailFileOpen, setDetailFileOpen] = useState(false);
  const [pendingOpenUserId, setPendingOpenUserId] = useState<string | null>(null);
  const [, setNowTick] = useState(0);
  const messageRefs = useMemo(() => new Map<string, HTMLDivElement | null>(), []);
  const messageScrollRef = useRef<HTMLDivElement | null>(null);
  const detailFileRef = useRef<HTMLDivElement | null>(null);
  const floatingBtnRef = useRef<HTMLButtonElement | null>(null);
  const contextRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef({ active: false, offsetX: 0, offsetY: 0, moved: false });

  const getDefaultFloatingPos = () => {
    const defaultSize = 48;
    const margin = 24;
    if (typeof window === "undefined") {
      return { x: margin, y: margin };
    }
    return {
      x: Math.max(margin, window.innerWidth - defaultSize - margin),
      y: Math.max(margin, window.innerHeight - defaultSize - margin),
    };
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTick((prev) => prev + 1);
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedHidden = localStorage.getItem(FLOATING_DM_STORAGE_KEYS.floatingHidden);
    if (storedHidden === "true") {
      setFloatingHidden(true);
    }
    const storedPos = localStorage.getItem(FLOATING_DM_STORAGE_KEYS.floatingPos);
    if (storedPos) {
      try {
        const parsed = JSON.parse(storedPos);
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          setFloatingPos(parsed);
          return;
        }
      } catch {
        // ignore
      }
    }
    setFloatingPos(getDefaultFloatingPos());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!floatingPos) return;
    localStorage.setItem(FLOATING_DM_STORAGE_KEYS.floatingPos, JSON.stringify(floatingPos));
  }, [floatingPos]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(FLOATING_DM_STORAGE_KEYS.floatingHidden, floatingHidden ? "true" : "false");
  }, [floatingHidden]);

  useEffect(() => {
    if (!contextOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!contextRef.current) return;
      if (!contextRef.current.contains(event.target as Node)) {
        setContextOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContextOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [contextOpen]);

  useEffect(() => {
    const show = () => setFloatingHidden(false);
    const hide = () => setFloatingHidden(true);
    window.addEventListener("dm:show-floating", show as EventListener);
    window.addEventListener("dm:hide-floating", hide as EventListener);
    return () => {
      window.removeEventListener("dm:show-floating", show as EventListener);
      window.removeEventListener("dm:hide-floating", hide as EventListener);
    };
  }, []);

  const loadFriends = useCallback(async () => {
    if (!workspace?.id) return;
    setLoadingFriends(true);
    try {
      const list = await fetchFriends(workspace.id);
      setFriends(list);
      if (!selected && list.length > 0) {
        setSelected(list[0]);
      }
      setUnreadByFriend((prev) => {
        const next = { ...prev };
        list.forEach((friend) => {
          if (next[friend.userId] === undefined) next[friend.userId] = 0;
        });
        if (typeof window !== "undefined") {
          localStorage.setItem(FLOATING_DM_STORAGE_KEYS.unread, JSON.stringify(next));
        }
        return next;
      });
    } catch (err) {
      console.error("Failed to load friends", err);
    } finally {
      setLoadingFriends(false);
    }
  }, [selected, workspace?.id]);

  useEffect(() => {
    if (!open) return;
    void loadFriends();
  }, [loadFriends, open]);

  useEffect(() => {
    if (!pendingOpenUserId) return;
    if (friends.length === 0) return;
    const friend = friends.find((item) => item.userId === pendingOpenUserId);
    if (!friend) return;
    setSelected(friend);
    setView("chat");
    setPendingOpenUserId(null);
  }, [friends, pendingOpenUserId]);

  useEffect(() => {
    if (!detailFileOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!detailFileRef.current) return;
      if (!detailFileRef.current.contains(event.target as Node)) {
        setDetailFileOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailFileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [detailFileOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const recents = localStorage.getItem(FLOATING_DM_STORAGE_KEYS.recents);
    const unread = localStorage.getItem(FLOATING_DM_STORAGE_KEYS.unread);
    const read = localStorage.getItem(FLOATING_DM_STORAGE_KEYS.read);
    if (recents) {
      try {
        const parsed = JSON.parse(recents);
        if (parsed && typeof parsed === "object") setRecentByFriend(parsed);
      } catch {
        setRecentByFriend({});
      }
    }
    if (unread) {
      try {
        const parsed = JSON.parse(unread);
        if (parsed && typeof parsed === "object") setUnreadByFriend(parsed);
      } catch {
        setUnreadByFriend({});
      }
    }
    if (read) {
      try {
        const parsed = JSON.parse(read);
        if (parsed && typeof parsed === "object") setLastReadAt(parsed);
      } catch {
        setLastReadAt({});
      }
    }
  }, []);

  const loadRoom = useCallback(async () => {
    if (!selected) return;
    setLoadingMessages(true);
    try {
      const room = await createDmRoom([selected.userId]);
      const id = room?.id as string | undefined;
      if (!id) return;
      setRoomId(id);
      const data = await fetchDmMessages(id, 30);
      const list = Array.isArray(data) ? data : [];
      setMessages(list);
      const last = list[list.length - 1];
      if (last?.content) {
        setRecentByFriend((prev) => ({
          ...prev,
          [selected.userId]: { preview: last.content ?? "", at: last.createdAt },
        }));
      }
      setUnreadByFriend((prev) => {
        const next = { ...prev, [selected.userId]: 0 };
        if (typeof window !== "undefined") {
          localStorage.setItem(FLOATING_DM_STORAGE_KEYS.unread, JSON.stringify(next));
        }
        return next;
      });
      setLastReadAt((prev) => {
        const next = { ...prev, [selected.userId]: new Date().toISOString() };
        if (typeof window !== "undefined") {
          localStorage.setItem(FLOATING_DM_STORAGE_KEYS.read, JSON.stringify(next));
        }
        return next;
      });
      requestAnimationFrame(() => {
        if (last?.id) scrollToMessage(last.id);
      });
    } catch (err) {
      console.error("Failed to load DM room", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [selected]);

  useEffect(() => {
    if (!open) return;
    if (!selected) return;
    void loadRoom();
  }, [loadRoom, open, selected]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      setFloatingHidden(false);
      setFloatingPos(getDefaultFloatingPos());
      setOpen(true);
    };
    window.addEventListener("dm:open", handler as EventListener);
    const handleOpenFriend = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (!detail?.userId) return;
      setFloatingHidden(false);
      setFloatingPos(getDefaultFloatingPos());
      setPendingOpenUserId(detail.userId);
      setOpen(true);
    };
    window.addEventListener("dm:open-friend", handleOpenFriend as EventListener);
    return () => {
      window.removeEventListener("dm:open", handler as EventListener);
      window.removeEventListener("dm:open-friend", handleOpenFriend as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setView("list");
      setSearchOpen(false);
      setDetailSearchOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || view !== "chat") return;
    if (!messageScrollRef.current) return;
    requestAnimationFrame(() => {
      if (!messageScrollRef.current) return;
      messageScrollRef.current.scrollTop = messageScrollRef.current.scrollHeight;
    });
  }, [messages, open, view]);

  useEffect(() => {
    if (!open) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const socket = getChatSocket(token);
    if (!socket) return;
    const handleMessageEvent = (payload: { type: string; roomId: string; payload: any }) => {
      if (payload.type === "reaction") {
        if (!roomId || payload.roomId !== roomId) return;
        const { messageId, emoji, userId, action } = payload.payload ?? {};
        if (!messageId || !emoji) return;
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== messageId) return msg;
            const reactions = [...(msg.reactions ?? [])];
            const existingIndex = reactions.findIndex((item) => item.emoji === emoji);
            const reactedByMe = userId === profile?.id;
            if (existingIndex === -1) {
              reactions.push({ emoji, count: 1, reactedByMe });
            } else {
              const existing = reactions[existingIndex];
              const nextCount = action === "added" ? existing.count + 1 : Math.max(0, existing.count - 1);
              if (nextCount === 0) {
                reactions.splice(existingIndex, 1);
              } else {
                reactions[existingIndex] = {
                  ...existing,
                  count: nextCount,
                  reactedByMe: reactedByMe ? action === "added" : existing.reactedByMe,
                };
              }
            }
            return { ...msg, reactions };
          })
        );
        return;
      }

      if (payload.type === "created") {
        const message = payload.payload as DmMessage;
        if (!message?.id) return;
        if (payload.roomId === roomId) {
          setMessages((prev) => [...prev, message]);
          if (selected) {
            setRecentByFriend((prev) => ({
              ...prev,
              [selected.userId]: { preview: message.content ?? "", at: message.createdAt },
            }));
          }
        } else if (message.senderId && message.senderId !== profile?.id) {
          setRecentByFriend((prev) => ({
            ...prev,
            [message.senderId]: { preview: message.content ?? "", at: message.createdAt },
          }));
          setUnreadByFriend((prev) => {
            const next = { ...prev, [message.senderId]: (prev[message.senderId] ?? 0) + 1 };
            if (typeof window !== "undefined") {
              localStorage.setItem(FLOATING_DM_STORAGE_KEYS.unread, JSON.stringify(next));
            }
            return next;
          });
        }
      }
    };
    socket.on("message.event", handleMessageEvent);
    return () => {
      socket.off("message.event", handleMessageEvent);
    };
  }, [open, profile?.id, roomId]);

  const orderedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  const groupedMessages = useMemo(() => {
    const groups: Array<{ dateKey: string; items: DmMessage[] }> = [];
    orderedMessages.forEach((msg) => {
      const key = new Date(msg.createdAt).toDateString();
      const last = groups[groups.length - 1];
      if (!last || last.dateKey !== key) {
        groups.push({ dateKey: key, items: [msg] });
      } else {
        last.items.push(msg);
      }
    });
    return groups;
  }, [orderedMessages]);

  const filteredFriends = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return friends;
    return friends.filter((friend) => friend.displayName.toLowerCase().includes(keyword));
  }, [friends, query]);

  const recentFriends = useMemo(() => {
    const list = friends
      .filter((friend) => recentByFriend[friend.userId])
      .map((friend) => ({
        friend,
        meta: recentByFriend[friend.userId],
      }))
      .sort((a, b) => new Date(b.meta.at).getTime() - new Date(a.meta.at).getTime());
    return list;
  }, [friends, recentByFriend]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(FLOATING_DM_STORAGE_KEYS.recents, JSON.stringify(recentByFriend));
  }, [recentByFriend]);

  const handleSelectFriend = (friend: FriendProfile) => {
    setSelected(friend);
    setView("chat");
    setUnreadByFriend((prev) => {
      const next = { ...prev, [friend.userId]: 0 };
      if (typeof window !== "undefined") {
        localStorage.setItem(FLOATING_DM_STORAGE_KEYS.unread, JSON.stringify(next));
      }
      return next;
    });
    setLastReadAt((prev) => {
      const next = { ...prev, [friend.userId]: new Date().toISOString() };
      if (typeof window !== "undefined") {
        localStorage.setItem(FLOATING_DM_STORAGE_KEYS.read, JSON.stringify(next));
      }
      return next;
    });
  };

  const handleSend = async () => {
    if (!canSend || !roomId) return;
    const content = draft.trim();
    setDraft("");
    try {
      const message = await sendDmMessage(roomId, content, replyTarget?.id);
      if (message?.id) {
        setMessages((prev) => [...prev, message]);
        if (selected) {
          setRecentByFriend((prev) => ({
            ...prev,
            [selected.userId]: { preview: content, at: message.createdAt ?? new Date().toISOString() },
          }));
          setUnreadByFriend((prev) => {
            const next = { ...prev, [selected.userId]: 0 };
            if (typeof window !== "undefined") {
              localStorage.setItem(FLOATING_DM_STORAGE_KEYS.unread, JSON.stringify(next));
            }
            return next;
          });
          setLastReadAt((prev) => {
            const next = { ...prev, [selected.userId]: new Date().toISOString() };
            if (typeof window !== "undefined") {
              localStorage.setItem(FLOATING_DM_STORAGE_KEYS.read, JSON.stringify(next));
            }
            return next;
          });
        }
        setReplyTarget(null);
      }
    } catch (err) {
      console.error("Failed to send DM", err);
    }
  };

  const scrollToMessage = (messageId?: string) => {
    if (!messageId) return;
    const el = messageRefs.get(messageId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary/40");
      window.setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary/40");
      }, 1200);
    }
  };

  useEffect(() => {
    if (!searchOpen) return;
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) {
      setSearchResults([]);
      setSearchIndex(0);
      return;
    }
    const matches = orderedMessages
      .filter((msg) => (msg.content ?? "").toLowerCase().includes(keyword))
      .map((msg) => msg.id);
    setSearchResults(matches);
    setSearchIndex(0);
  }, [orderedMessages, searchOpen, searchQuery]);

  useEffect(() => {
    if (searchOpen) return;
    setSearchResults([]);
    setSearchIndex(0);
  }, [searchOpen]);

  const goToSearchResult = (direction: "next" | "prev") => {
    if (searchResults.length === 0) return;
    setSearchIndex((prev) => {
      const nextIndex =
        direction === "next"
          ? (prev + 1) % searchResults.length
          : (prev - 1 + searchResults.length) % searchResults.length;
      const targetId = searchResults[nextIndex];
      scrollToMessage(targetId);
      return nextIndex;
    });
  };

  const detailResults = useMemo(() => {
    const keyword = detailKeyword.trim().toLowerCase();
    return orderedMessages.filter((msg) => {
      if (keyword && !(msg.content ?? "").toLowerCase().includes(keyword)) return false;
      if (detailDate) {
        const msgDate = new Date(msg.createdAt);
        const target = new Date(detailDate);
        if (
          msgDate.getFullYear() !== target.getFullYear() ||
          msgDate.getMonth() !== target.getMonth() ||
          msgDate.getDate() !== target.getDate()
        ) {
          return false;
        }
      }
      if (detailFileType) {
        return false;
      }
      return true;
    });
  }, [detailDate, detailFileType, detailKeyword, orderedMessages]);

  const handleToggleReaction = (messageId: string, emoji: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const socket = getChatSocket(token);
    socket?.emit("toggle-reaction", { messageId, emoji });
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const reactions = [...(msg.reactions ?? [])];
        const existingIndex = reactions.findIndex((item) => item.emoji === emoji);
        if (existingIndex === -1) {
          reactions.push({ emoji, count: 1, reactedByMe: true });
        } else {
          const existing = reactions[existingIndex];
          if (existing.reactedByMe) {
            const nextCount = Math.max(0, existing.count - 1);
            if (nextCount === 0) reactions.splice(existingIndex, 1);
            else reactions[existingIndex] = { ...existing, count: nextCount, reactedByMe: false };
          } else {
            reactions[existingIndex] = { ...existing, count: existing.count + 1, reactedByMe: true };
          }
        }
        return { ...msg, reactions };
      })
    );
  };

  return (
    <>
      <FloatingLauncher
        hidden={floatingHidden}
        pos={floatingPos}
        contextOpen={contextOpen}
        contextPos={contextPos}
        floatingBtnRef={floatingBtnRef}
        contextRef={contextRef}
        dragState={dragState}
        onOpen={() => setOpen(true)}
        onSetContextOpen={setContextOpen}
        onSetContextPos={setContextPos}
        onSetPos={setFloatingPos}
        onHide={() => {
          setOpen(false);
          setFloatingHidden(true);
          if (typeof window !== "undefined") {
            localStorage.removeItem(FLOATING_DM_STORAGE_KEYS.floatingPos);
          }
        }}
      />

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setView("list");
          setSearchOpen(false);
          setDetailSearchOpen(false);
        }}
        title="Direct Message"
        widthClass={detailSearchOpen ? "max-w-5xl" : "max-w-3xl"}
        bodyClassName="overflow-hidden"
      >
        <div className="h-[72vh] p-6">
          {view === "list" ? (
            <DmListView
              loading={loadingFriends}
              query={query}
              onChangeQuery={setQuery}
              filteredFriends={filteredFriends}
              recentFriends={recentFriends}
              selectedMemberId={selected?.memberId}
              myUserId={profile?.id}
              unreadByFriend={unreadByFriend}
              recentByFriend={recentByFriend}
              onSelectFriend={handleSelectFriend}
            />
          ) : (
            <div className={`grid h-full gap-4 ${detailSearchOpen ? "md:grid-cols-[1fr_280px]" : ""}`}>
              <div className="flex min-h-0 h-full flex-col rounded-2xl border border-border bg-panel/80">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
                <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted hover:text-foreground"
                  onClick={() => setView("list")}
                  aria-label="Back to friends"
                >
                  <ArrowLeft size={14} />
                </button>
                <span>
                  {selected?.displayName ?? ""}
                  {selected?.userId === profile?.id ? " (나)" : ""}
                </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted hover:text-foreground"
                    onClick={() => setSearchOpen((prev) => !prev)}
                    aria-label="Search messages"
                  >
                    <Search size={14} />
                  </button>
                </div>
              </div>
              {searchOpen && (
                <div className="border-b border-border px-4 py-2">
                  <div className="flex items-center gap-2 rounded-full border border-border bg-panel px-4">
                    <input
                      className="h-9 w-full bg-transparent text-xs text-foreground placeholder:text-muted focus:outline-none"
                      placeholder="메시지 검색"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const keyword = searchQuery.trim().toLowerCase();
                          if (!keyword) return;
                          if (searchResults.length > 0) {
                            goToSearchResult("next");
                          }
                        }
                      }}
                    />
                    <div className="flex items-center gap-1 text-[10px] text-muted">
                      <span>
                        {searchResults.length === 0 ? "0" : searchIndex + 1}/{searchResults.length}
                      </span>
                      <button
                        type="button"
                        className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted hover:text-foreground"
                        onClick={() => goToSearchResult("prev")}
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted hover:text-foreground"
                        onClick={() => goToSearchResult("next")}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      className="rounded-full border border-border px-3 py-1 text-[10px] text-muted hover:text-foreground"
                      onClick={() => setDetailSearchOpen((prev) => !prev)}
                    >
                      상세검색하기
                    </button>
                  </div>
                </div>
              )}
              <div ref={messageScrollRef} className="flex-1 min-h-0 space-y-4 overflow-y-auto px-4 py-3 text-sm">
                {loadingMessages ? (
                  <div className="rounded-xl border border-border bg-panel/80 p-3 text-xs text-muted">메시지 불러오는 중...</div>
                ) : orderedMessages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-panel/80 p-3 text-xs text-muted">
                    아직 메시지가 없습니다.
                  </div>
                ) : (
                  groupedMessages.map((group) => (
                    <div key={group.dateKey} className="space-y-4">
                      <div className="flex items-center gap-3 py-1">
                        <div className="h-0 flex-1 border-t border-border/80" />
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                            {getFloatingDmRelativeDateLabel(new Date(group.items[0].createdAt))}
                          </span>
                          <span className="text-[9px] uppercase tracking-[0.2em] text-muted/70">
                            {new Date(group.items[0].createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="h-0 flex-1 border-t border-border/80" />
                      </div>
                      {group.items.map((msg) => {
                        const mine = msg.senderId === profile?.id;
                        return (
                          <div
                            key={msg.id}
                            ref={(el) => {
                              messageRefs.set(msg.id, el);
                            }}
                            className={`group flex ${mine ? "justify-end" : "justify-start"} rounded-2xl transition ${
                              searchResults.includes(msg.id)
                                ? "bg-black/5 dark:bg-white/5"
                                : "hover:bg-black/5 dark:hover:bg-white/5"
                            }`}
                          >
                            <div className="flex w-full items-start gap-3">
                              <div className="h-10 w-10 overflow-hidden rounded-full bg-muted/20 text-[10px] font-semibold text-foreground">
                                {mine ? (
                                  profile?.avatarUrl ? (
                                    <img
                                      src={profile.avatarUrl}
                                      alt={profile.displayName ?? "Me"}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      {getFloatingDmInitials(profile?.displayName ?? profile?.name ?? "Me")}
                                    </div>
                                  )
                                ) : selected?.avatarUrl ? (
                                  <img src={selected.avatarUrl} alt={selected.displayName} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    {getFloatingDmInitials(selected?.displayName)}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
                                    <span>{mine ? profile?.displayName ?? profile?.name ?? "Me" : selected?.displayName ?? "Friend"}</span>
                                    {mine && (
                                      <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-foreground">
                                        나
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-muted">
                                    {getFloatingDmMessageTimeLabel(new Date(msg.createdAt))}
                                  </div>
                                </div>
                                {msg.reply && (
                                  <button
                                    type="button"
                                    className="mt-1 flex w-full items-center gap-3 rounded-xl border border-border/70 bg-panel/70 px-3 py-2 text-left text-[12px] text-muted transition hover:border-border hover:text-foreground"
                                    onClick={() => scrollToMessage(msg.reply?.id)}
                                  >
                                    <span className="h-7 w-7 overflow-hidden rounded-full bg-muted/20 text-[10px] font-semibold text-foreground">
                                      {msg.reply.sender?.avatar ? (
                                        <img
                                          src={msg.reply.sender.avatar}
                                          alt={msg.reply.sender.name ?? "User"}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <span className="flex h-full w-full items-center justify-center">
                                          {getFloatingDmInitials(msg.reply.sender?.name ?? "User")}
                                        </span>
                                      )}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 text-[10px] text-muted">
                                        <span className="font-semibold text-foreground">
                                          {msg.reply.sender?.name ?? "User"}
                                        </span>
                                        <span>Reply</span>
                                      </div>
                                      <div className="truncate text-[11px] text-muted">
                                        {msg.reply.isDeleted ? "(삭제된 메시지)" : msg.reply.content ?? ""}
                                      </div>
                                    </div>
                                    <span className="h-full w-[2px] rounded-full bg-border/80" />
                                  </button>
                                )}
                                <div className="mt-1 text-left text-[16px] text-foreground">{msg.content ?? ""}</div>
                                {msg.reactions && msg.reactions.length > 0 && (
                                  <div className={`mt-2 flex flex-wrap gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                                    {msg.reactions.map((reaction) => (
                                      <button
                                        key={`${msg.id}-${reaction.emoji}`}
                                        type="button"
                                        className={`rounded-full border px-2 py-0.5 text-[11px] ${
                                          reaction.reactedByMe
                                            ? "border-primary/50 bg-primary/10 text-foreground"
                                            : "border-border bg-panel/80 text-muted"
                                        }`}
                                        onClick={() => handleToggleReaction(msg.id, reaction.emoji)}
                                      >
                                        {reaction.emoji} {reaction.count}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted opacity-0 transition group-hover:opacity-100">
                                  <button
                                    type="button"
                                    className="rounded-full border border-border px-2 py-0.5 hover:text-foreground"
                                    onClick={() => {
                                      setReplyTarget(msg);
                                    }}
                                  >
                                    Reply
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-full border border-border px-2 py-0.5 hover:text-foreground"
                                    onClick={() => setEmojiOpenFor((prev) => (prev === msg.id ? null : msg.id))}
                                  >
                                    Reaction
                                  </button>
                                </div>
                                {emojiOpenFor === msg.id && (
                                  <div className="mt-2 inline-flex flex-wrap gap-2 rounded-xl border border-border bg-panel/80 px-3 py-2">
                                    {FLOATING_DM_EMOJIS.map((emoji) => (
                                      <button
                                        key={`${msg.id}-${emoji}`}
                                        type="button"
                                        className="rounded-full px-1 text-base"
                                        onClick={() => {
                                          handleToggleReaction(msg.id, emoji);
                                          setEmojiOpenFor(null);
                                        }}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2 border-t border-border px-4 py-3">
                <div className="flex-1">
                  {replyTarget && (
                    <div className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-panel/80 px-3 py-2 text-left text-[11px] text-muted">
                      <span className="h-6 w-6 overflow-hidden rounded-full bg-muted/20 text-[10px] font-semibold text-foreground">
                        {replyTarget.sender?.avatar ? (
                          <img
                            src={replyTarget.sender.avatar}
                            alt={replyTarget.sender.name ?? "User"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center">
                            {getFloatingDmInitials(replyTarget.sender?.name ?? "User")}
                          </span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[10px] text-muted">
                          <span className="font-semibold text-foreground">
                            {replyTarget.sender?.name ?? "User"}
                          </span>
                          <span>Replying</span>
                        </div>
                        <div className="truncate text-[11px] text-muted">{replyTarget.content ?? ""}</div>
                      </div>
                      <button
                        type="button"
                        className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted hover:text-foreground"
                        onClick={() => setReplyTarget(null)}
                      >
                        취소
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3 rounded-full border border-border bg-panel/80 px-4 py-2">
                    <button
                      type="button"
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-panel text-muted hover:text-foreground"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-panel text-muted hover:text-foreground"
                      onClick={() => setInputEmojiOpen((prev) => !prev)}
                    >
                      <Smile size={14} />
                    </button>
                    <input
                      className="h-9 flex-1 bg-transparent text-xs text-foreground placeholder:text-muted focus:outline-none"
                      placeholder="#대화에 메시지 보내기"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-white disabled:opacity-50"
                      disabled={!canSend}
                      onClick={handleSend}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                  {inputEmojiOpen && (
                    <div className="mt-2 inline-flex flex-wrap gap-2 rounded-xl border border-border bg-panel/80 px-3 py-2">
                      {FLOATING_DM_EMOJIS.map((emoji) => (
                        <button
                          key={`input-${emoji}`}
                          type="button"
                          className="rounded-full px-1 text-base"
                          onClick={() => setDraft((prev) => `${prev}${emoji}`)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </div>
              {detailSearchOpen && (
                <aside className="hidden h-full min-h-0 rounded-2xl border border-border bg-panel/80 p-4 shadow-panel md:flex md:flex-col md:gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-muted">상세검색</p>
                    <h4 className="mt-2 text-sm font-semibold text-foreground">필터</h4>
                  </div>
                  <div className="flex min-h-0 flex-col gap-3 text-xs text-muted">
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-muted">메시지</p>
                      <input
                        className="h-9 w-full rounded-full border border-border bg-panel px-3 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                        placeholder="키워드 검색"
                        value={detailKeyword}
                        onChange={(e) => setDetailKeyword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-muted">날짜</p>
                      <input
                        type="date"
                        className="h-9 w-full rounded-full border border-border bg-panel px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                        value={detailDate}
                        onChange={(e) => setDetailDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-muted">분류</p>
                      <div ref={detailFileRef} className="relative">
                        <button
                          type="button"
                          className="flex h-9 w-full items-center justify-between rounded-full border border-border bg-panel px-3 text-xs text-foreground transition hover:border-primary"
                          onClick={() => setDetailFileOpen((prev) => !prev)}
                        >
                          <span>
                            {FLOATING_DM_FILE_TYPE_OPTIONS.find((option) => option.value === detailFileType)?.label ?? "전체"}
                          </span>
                          <ChevronDown size={12} className={`transition ${detailFileOpen ? "rotate-180" : ""}`} />
                        </button>
                        {detailFileOpen && (
                          <div className="absolute z-20 mt-2 w-full rounded-2xl border border-border bg-panel p-1 shadow-lg">
                            {FLOATING_DM_FILE_TYPE_OPTIONS.map((option) => (
                              <button
                                key={option.value || "all"}
                                type="button"
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs text-foreground transition hover:bg-black/5 dark:hover:bg-white/5 ${
                                  detailFileType === option.value ? "bg-black/10 dark:bg-white/10" : ""
                                }`}
                                onClick={() => {
                                  setDetailFileType(option.value);
                                  setDetailFileOpen(false);
                                }}
                              >
                                <span>{option.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex min-h-0 flex-col gap-2 border-t border-border pt-3">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-muted">검색 결과</p>
                      {detailFileType ? (
                        <div className="rounded-xl border border-border bg-panel/80 p-3 text-[11px] text-muted">
                          파일 검색은 파일 메타 연동 후 제공됩니다.
                        </div>
                      ) : detailResults.length === 0 ? (
                        <div className="rounded-xl border border-border bg-panel/80 p-3 text-[11px] text-muted">
                          검색 결과가 없습니다.
                        </div>
                      ) : (
                        <div className="flex-1 min-h-0 space-y-2 overflow-y-auto">
                          {detailResults.map((msg) => (
                            <button
                              key={`detail-${msg.id}`}
                              type="button"
                              className={`flex w-full items-center gap-3 rounded-xl border border-border bg-panel/80 px-3 py-2 text-left text-[11px] text-muted hover:text-foreground ${
                                searchResults.includes(msg.id) ? "bg-black/5 dark:bg-white/5" : ""
                              }`}
                              onClick={() => {
                                setSearchResults([msg.id]);
                                setSearchIndex(0);
                                scrollToMessage(msg.id);
                              }}
                            >
                              <div className="h-8 w-8 overflow-hidden rounded-full bg-muted/20 text-xs font-semibold text-foreground">
                                {msg.sender?.avatar ? (
                                  <img src={msg.sender.avatar} alt={msg.sender.name ?? "User"} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    {getFloatingDmInitials(msg.sender?.name ?? "User")}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate font-semibold text-foreground">
                                    {msg.sender?.name ?? "User"}
                                  </span>
                                  <span className="text-[10px] text-muted">
                                    {new Date(msg.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="truncate">{msg.content ?? ""}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </aside>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
