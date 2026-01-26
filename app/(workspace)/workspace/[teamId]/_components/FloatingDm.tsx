'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageSquare, Search, Send, Star, Smile } from "lucide-react";
import Modal from "@/components/common/Modal";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { fetchFriends, type FriendProfile } from "@/lib/members";
import { createDmRoom, fetchDmMessages, sendDmMessage, type DmMessage } from "@/lib/chat";
import { getChatSocket } from "@/lib/socket";

const getInitials = (name?: string | null) => {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export default function FloatingDm() {
  const { workspace } = useWorkspace();
  const { profile } = useAuthProfile();
  const [open, setOpen] = useState(false);
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
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const canSend = draft.trim().length > 0 && !!roomId;
  const [view, setView] = useState<"list" | "chat">("list");
  const [lastReadAt, setLastReadAt] = useState<Record<string, string>>({});
  const [replyTarget, setReplyTarget] = useState<DmMessage | null>(null);
  const [emojiOpenFor, setEmojiOpenFor] = useState<string | null>(null);
  const [inputEmojiOpen, setInputEmojiOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const messageRefs = useMemo(() => new Map<string, HTMLDivElement | null>(), []);

  const FAVORITES_KEY = "friends:dm:favorites";
  const RECENTS_KEY = "friends:dm:recents";
  const UNREAD_KEY = "friends:dm:unread";
  const READ_KEY = "friends:dm:read";
  const EMOJIS = ["😀", "😂", "😍", "👍", "🎉", "🔥", "🥳", "😅", "😎", "🙏"];

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
          localStorage.setItem(UNREAD_KEY, JSON.stringify(next));
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
    if (typeof window === "undefined") return;
    const favorites = localStorage.getItem(FAVORITES_KEY);
    const recents = localStorage.getItem(RECENTS_KEY);
    const unread = localStorage.getItem(UNREAD_KEY);
    const read = localStorage.getItem(READ_KEY);
    if (favorites) {
      try {
        const parsed = JSON.parse(favorites);
        if (Array.isArray(parsed)) setFavoriteIds(parsed);
      } catch {
        setFavoriteIds([]);
      }
    }
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
          localStorage.setItem(UNREAD_KEY, JSON.stringify(next));
        }
        return next;
      });
      setLastReadAt((prev) => {
        const next = { ...prev, [selected.userId]: new Date().toISOString() };
        if (typeof window !== "undefined") {
          localStorage.setItem(READ_KEY, JSON.stringify(next));
        }
        return next;
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
    const handler = () => setOpen(true);
    window.addEventListener("dm:open", handler as EventListener);
    return () => window.removeEventListener("dm:open", handler as EventListener);
  }, []);

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
              localStorage.setItem(UNREAD_KEY, JSON.stringify(next));
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

  const favoriteFriends = useMemo(
    () => friends.filter((friend) => favoriteIds.includes(friend.userId)),
    [favoriteIds, friends]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recentByFriend));
  }, [recentByFriend]);

  const toggleFavorite = (userId: string) => {
    setFavoriteIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const handleSelectFriend = (friend: FriendProfile) => {
    setSelected(friend);
    setView("chat");
    setUnreadByFriend((prev) => {
      const next = { ...prev, [friend.userId]: 0 };
      if (typeof window !== "undefined") {
        localStorage.setItem(UNREAD_KEY, JSON.stringify(next));
      }
      return next;
    });
    setLastReadAt((prev) => {
      const next = { ...prev, [friend.userId]: new Date().toISOString() };
      if (typeof window !== "undefined") {
        localStorage.setItem(READ_KEY, JSON.stringify(next));
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
              localStorage.setItem(UNREAD_KEY, JSON.stringify(next));
            }
            return next;
          });
          setLastReadAt((prev) => {
            const next = { ...prev, [selected.userId]: new Date().toISOString() };
            if (typeof window !== "undefined") {
              localStorage.setItem(READ_KEY, JSON.stringify(next));
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
      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition hover:scale-[1.02]"
        onClick={() => setOpen(true)}
        aria-label="Open DM"
      >
        <MessageSquare size={18} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Direct Message" widthClass="max-w-3xl">
        <div className="p-6">
          {view === "list" ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Direct Messages</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">대화</h3>
              </div>
              <div className="flex items-center rounded-full border border-border bg-panel px-4">
                <input
                  className="h-10 w-full bg-transparent text-xs text-foreground placeholder:text-muted focus:outline-none"
                  placeholder="이름 검색"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {loadingFriends ? (
                <div className="rounded-xl border border-border bg-panel/80 p-3 text-xs text-muted">불러오는 중...</div>
              ) : filteredFriends.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-panel/80 p-3 text-xs text-muted">
                  친구가 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {favoriteFriends.length > 0 && (
                    <div>
                      <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-muted">즐겨찾기</p>
                      <div className="space-y-2">
                        {favoriteFriends.map((friend) => (
                          <button
                            key={`fav-${friend.memberId}`}
                            type="button"
                            className="flex w-full items-center gap-3 rounded-xl border border-border bg-panel/80 px-3 py-2 text-left text-sm transition hover:bg-accent"
                            onClick={() => handleSelectFriend(friend)}
                          >
                            <div className="h-10 w-10 overflow-hidden rounded-full bg-muted/20 text-xs font-semibold text-foreground">
                              {friend.avatarUrl ? (
                                <img src={friend.avatarUrl} alt={friend.displayName} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  {getInitials(friend.displayName)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate font-medium text-foreground">{friend.displayName}</span>
                                <Star size={12} className="text-amber-400" fill="currentColor" />
                              </div>
                              <p className="truncate text-xs text-muted">즐겨찾는 대화</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {recentFriends.length > 0 && (
                    <div>
                      <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-muted">최근 대화</p>
                      <div className="space-y-2">
                        {recentFriends.map(({ friend, meta }) => (
                          <button
                            key={`recent-${friend.memberId}`}
                            type="button"
                            className="flex w-full items-center gap-3 rounded-xl border border-border bg-panel/80 px-3 py-2 text-left text-sm transition hover:bg-accent"
                            onClick={() => handleSelectFriend(friend)}
                          >
                            <div className="h-10 w-10 overflow-hidden rounded-full bg-muted/20 text-xs font-semibold text-foreground">
                              {friend.avatarUrl ? (
                                <img src={friend.avatarUrl} alt={friend.displayName} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  {getInitials(friend.displayName)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate font-medium text-foreground">{friend.displayName}</span>
                                <span className="text-[10px] text-muted">
                                  {new Date(meta.at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="truncate text-xs text-muted">{meta.preview}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-muted">친구 목록</p>
                    <div className="space-y-2">
                      {filteredFriends.map((friend) => (
                        <button
                          key={friend.memberId}
                          type="button"
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                            selected?.memberId === friend.memberId
                              ? "border-primary/60 bg-accent text-foreground"
                              : "border-border bg-panel/80 text-muted hover:bg-accent"
                          }`}
                          onClick={() => handleSelectFriend(friend)}
                        >
                          <div className="h-9 w-9 overflow-hidden rounded-full bg-muted/20 text-xs font-semibold text-foreground">
                            {friend.avatarUrl ? (
                              <img src={friend.avatarUrl} alt={friend.displayName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                {getInitials(friend.displayName)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{friend.displayName}</span>
                              <div className="flex items-center gap-2">
                                {unreadByFriend[friend.userId] ? (
                                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                    {unreadByFriend[friend.userId]}
                                  </span>
                                ) : null}
                                {recentByFriend[friend.userId] && (
                                  <span className="text-[10px] text-muted">
                                    {new Date(recentByFriend[friend.userId].at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            {recentByFriend[friend.userId] && (
                              <p className="truncate text-[11px] text-muted">
                                {recentByFriend[friend.userId].preview}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            className="rounded-full border border-border p-1 text-muted hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(friend.userId);
                            }}
                            aria-label="Toggle favorite"
                          >
                            <Star size={12} className={favoriteIds.includes(friend.userId) ? "text-amber-400" : ""} />
                          </button>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[480px] flex-col rounded-2xl border border-border bg-panel/80">
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
                <span>{selected?.displayName ?? ""}</span>
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
                            scrollToMessage(searchResults[searchIndex]);
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
                </div>
              )}
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3 text-sm">
                {loadingMessages ? (
                  <div className="rounded-xl border border-border bg-panel/80 p-3 text-xs text-muted">메시지 불러오는 중...</div>
                ) : orderedMessages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-panel/80 p-3 text-xs text-muted">
                    아직 메시지가 없습니다.
                  </div>
                ) : (
                  orderedMessages.map((msg) => {
                    const mine = msg.senderId === profile?.id;
                    return (
                      <div
                        key={msg.id}
                        ref={(el) => messageRefs.set(msg.id, el)}
                        className={`group flex ${mine ? "justify-end" : "justify-start"} ${
                          searchResults.includes(msg.id) ? "rounded-2xl ring-1 ring-amber-300/40" : ""
                        }`}
                      >
                        <div className={`max-w-[70%] ${mine ? "text-right" : "text-left"}`}>
                          <div className={`flex items-center gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                            <div className="h-6 w-6 overflow-hidden rounded-full bg-muted/20 text-[10px] font-semibold text-foreground">
                              {mine ? (
                                profile?.avatarUrl ? (
                                  <img src={profile.avatarUrl} alt={profile.displayName ?? "Me"} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    {getInitials(profile?.displayName ?? profile?.name ?? "Me")}
                                  </div>
                                )
                              ) : selected?.avatarUrl ? (
                                <img src={selected.avatarUrl} alt={selected.displayName} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  {getInitials(selected?.displayName)}
                                </div>
                              )}
                            </div>
                            <div className="text-[11px] font-semibold text-foreground">
                              {mine ? profile?.displayName ?? profile?.name ?? "Me" : selected?.displayName ?? "Friend"}
                            </div>
                            <div className="text-[10px] text-muted">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                          {msg.reply && (
                            <button
                              type="button"
                              className="mt-1 w-full rounded-xl border border-border bg-panel/80 px-3 py-2 text-left text-[11px] text-muted hover:text-foreground"
                              onClick={() => scrollToMessage(msg.reply?.id)}
                            >
                              <span className="font-semibold text-foreground">
                                {msg.reply.sender?.name ?? "User"}
                              </span>
                              <span className="ml-2">
                                {msg.reply.isDeleted ? "(삭제된 메시지)" : msg.reply.content ?? ""}
                              </span>
                            </button>
                          )}
                          <div
                            className={`mt-1 rounded-2xl px-3 py-2 text-left text-xs ${
                              mine ? "bg-foreground text-background" : "bg-accent text-foreground"
                            }`}
                          >
                            {msg.content ?? ""}
                          </div>
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
                          <div className={`mt-2 flex items-center gap-2 text-[11px] text-muted ${mine ? "justify-end" : "justify-start"} opacity-0 transition group-hover:opacity-100`}>
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
                            <div className={`mt-2 inline-flex flex-wrap gap-2 rounded-xl border border-border bg-panel/80 px-3 py-2`}>
                              {EMOJIS.map((emoji) => (
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
                    );
                  })
                )}
              </div>
              <div className="flex items-center gap-2 border-t border-border px-4 py-3">
                <div className="flex-1">
                  {replyTarget && (
                    <div className="mb-2 flex items-center justify-between rounded-xl border border-border bg-panel/80 px-3 py-2 text-left text-[11px] text-muted">
                      <span className="truncate">
                        <span className="font-semibold text-foreground">
                          {replyTarget.sender?.name ?? "User"}
                        </span>
                        <span className="ml-2">{replyTarget.content ?? ""}</span>
                      </span>
                      <button
                        type="button"
                        className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted hover:text-foreground"
                        onClick={() => setReplyTarget(null)}
                      >
                        취소
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted hover:text-foreground"
                      onClick={() => setInputEmojiOpen((prev) => !prev)}
                    >
                      <Smile size={14} />
                    </button>
                    <input
                      className="h-9 flex-1 rounded-full border border-border bg-panel px-4 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                      placeholder="메시지를 입력하세요"
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
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-50"
                      disabled={!canSend}
                      onClick={handleSend}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                  {inputEmojiOpen && (
                    <div className="mt-2 inline-flex flex-wrap gap-2 rounded-xl border border-border bg-panel/80 px-3 py-2">
                      {EMOJIS.map((emoji) => (
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
          )}
        </div>
      </Modal>
    </>
  );
}
