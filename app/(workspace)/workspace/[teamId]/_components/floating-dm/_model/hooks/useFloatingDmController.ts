// app/(workspace)/workspace/[teamId]/_components/floating-dm/_model/hooks/useFloatingDmController.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { fetchFriends, type FriendProfile } from "@/lib/members";
import { createDmRoom, fetchDmMessages, sendDmMessage, type DmMessage } from "@/lib/chat";
import { getChatSocket } from "@/lib/socket";
import { FLOATING_DM_STORAGE_KEYS } from "../constants/floating-dm.constants";

export function useFloatingDmController() {
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
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
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
  const draftInputRef = useRef<HTMLTextAreaElement | null>(null);
  const detailFileRef = useRef<HTMLDivElement | null>(null);
  const floatingBtnRef = useRef<HTMLButtonElement | null>(null);
  const contextRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef({ active: false, offsetX: 0, offsetY: 0, moved: false });
  const dmComposerShellClass = `flex items-start gap-2 rounded-2xl border px-2 py-2 transition ${
    inputFocused ? "border-brand/60 bg-panel shadow-[0_0_0_1px_rgba(59,130,246,0.18)]" : "border-border/70 bg-panel/95"
  }`;

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
    if (!draftInputRef.current) return;
    draftInputRef.current.style.height = "0px";
    draftInputRef.current.style.height = `${Math.min(draftInputRef.current.scrollHeight, 96)}px`;
  }, [draft]);

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
  }, [open, profile?.id, roomId, selected]);

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

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-dm-menu]")) return;
      setMenuOpenFor(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

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

  return {
    profile,
    open,
    setOpen,
    floatingHidden,
    setFloatingHidden,
    floatingPos,
    setFloatingPos,
    contextOpen,
    setContextOpen,
    contextPos,
    setContextPos,
    friends,
    selected,
    loadingFriends,
    loadingMessages,
    draft,
    setDraft,
    query,
    setQuery,
    recentByFriend,
    unreadByFriend,
    canSend,
    view,
    setView,
    replyTarget,
    setReplyTarget,
    emojiOpenFor,
    setEmojiOpenFor,
    menuOpenFor,
    setMenuOpenFor,
    inputFocused,
    setInputFocused,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    detailSearchOpen,
    setDetailSearchOpen,
    searchResults,
    setSearchResults,
    searchIndex,
    setSearchIndex,
    detailKeyword,
    setDetailKeyword,
    detailDate,
    setDetailDate,
    detailFileType,
    setDetailFileType,
    detailFileOpen,
    setDetailFileOpen,
    filteredFriends,
    recentFriends,
    orderedMessages,
    groupedMessages,
    detailResults,
    messageRefs,
    messageScrollRef,
    draftInputRef,
    detailFileRef,
    floatingBtnRef,
    contextRef,
    dragState,
    dmComposerShellClass,
    handleSelectFriend,
    handleSend,
    scrollToMessage,
    goToSearchResult,
    handleToggleReaction,
  };
}
