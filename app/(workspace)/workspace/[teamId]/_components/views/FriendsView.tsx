'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquareMore, UserPlus, Users } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/common/Modal";
import { useWorkspace } from "@/hooks/useWorkspace";
import { getChatSocket } from "@/lib/socket";
import {
  acceptFriendRequest,
  blockFriend,
  fetchOnlineUsers,
  fetchFriendRequests,
  fetchFriends,
  fetchSentFriendRequests,
  removeFriend,
  searchFriends,
  sendFriendRequest,
  type FriendProfile,
} from "@/lib/members";

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

const formatCount = (count: number) => count.toLocaleString();

type FriendsViewProps = {
  onSelectTeam?: (teamId: string) => void;
  activeTab?: "friends" | "requests" | "manage";
  onTabChange?: (tab: "friends" | "requests" | "manage") => void;
};

const HIDDEN_FRIENDS_KEY = "friends:hidden";
const statusColor: Record<"online" | "offline", string> = {
  online: "bg-emerald-400/10 text-emerald-300",
  offline: "bg-slate-500/15 text-muted",
};

export default function FriendsView({ onSelectTeam, activeTab: activeTabProp, onTabChange }: FriendsViewProps) {
  const { show } = useToast();
  const { workspace } = useWorkspace();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [requests, setRequests] = useState<FriendProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendProfile[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FriendProfile[] | null>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [internalTab, setInternalTab] = useState<"friends" | "requests" | "manage">("friends");
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const activeTab = activeTabProp ?? internalTab;
  const setActiveTab = onTabChange ?? setInternalTab;

  const loadFriends = useCallback(async () => {
    try {
      const [friendList, requestList, sentList] = await Promise.all([
        fetchFriends(workspace?.id),
        fetchFriendRequests(workspace?.id),
        fetchSentFriendRequests(workspace?.id),
      ]);
      setFriends(friendList);
      setRequests(requestList);
      setSentRequests(sentList);
    } catch (err) {
      console.error("Failed to load friends", err);
      show({
        title: "친구 목록을 불러오지 못했습니다.",
        description: "잠시 후 다시 시도해주세요.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [show, workspace?.id]);

  useEffect(() => {
    void loadFriends();
  }, [loadFriends]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("friends:refresh", { detail: { count: friends.length } }));
  }, [friends.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(HIDDEN_FRIENDS_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setHiddenIds(parsed.filter((id) => typeof id === "string"));
      }
    } catch {
      setHiddenIds([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadPresence = async () => {
      try {
        const ids = await fetchOnlineUsers();
        if (active) setOnlineUserIds(ids);
      } catch (err) {
        console.error("Failed to load presence", err);
      }
    };
    void loadPresence();
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const socket = getChatSocket(token);
    if (socket) {
      const handleUpdate = (payload: { onlineUserIds?: string[] }) => {
        if (!payload?.onlineUserIds) return;
        setOnlineUserIds(payload.onlineUserIds);
      };
      socket.on("presence.snapshot", handleUpdate);
      socket.on("presence.update", handleUpdate);
      return () => {
        active = false;
        socket.off("presence.snapshot", handleUpdate);
        socket.off("presence.update", handleUpdate);
      };
    }
    const interval = window.setInterval(loadPresence, 20000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const normalized = query.trim();
    if (!normalized) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const results = await searchFriends(normalized, workspace?.id);
        setSearchResults(results);
      } catch (err) {
        console.error("Failed to search friends", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, workspace?.id]);

  const displayFriends = useMemo(() => searchResults ?? friends, [friends, searchResults]);

  const orderedFriends = useMemo(() => {
    const list = [...displayFriends];
    if (sortBy === "name") {
      return list.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    return list.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [displayFriends, sortBy]);

  const visibleFriends = useMemo(
    () => orderedFriends.filter((friend) => !hiddenIds.includes(friend.memberId)),
    [hiddenIds, orderedFriends]
  );

  const handleSendRequest = async () => {
    const trimmed = email.trim();
    if (!trimmed || sending) return;
    try {
      setSending(true);
      await sendFriendRequest(trimmed);
      setEmail("");
      show({
        title: "친구 요청을 보냈습니다.",
        description: "상대가 수락하면 친구 목록에 표시됩니다.",
        variant: "success",
      });
      await loadFriends();
    } catch (err) {
      console.error("Failed to send friend request", err);
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      show({
        title: "친구 요청 실패",
        description: Array.isArray(message) ? message.join(" ") : message || "잠시 후 다시 시도해주세요.",
        variant: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (memberId: string) => {
    if (!memberId || actioningId) return;
    try {
      setActioningId(memberId);
      await acceptFriendRequest(memberId);
      show({
        title: "친구 요청을 수락했습니다.",
        description: "이제 친구 목록에서 확인할 수 있어요.",
        variant: "success",
      });
      await loadFriends();
    } catch (err) {
      console.error("Failed to accept friend", err);
      show({
        title: "요청 수락 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "error",
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!memberId || actioningId) return;
    try {
      setActioningId(memberId);
      await removeFriend(memberId);
      show({
        title: "친구가 삭제되었습니다.",
        description: "필요하면 다시 요청할 수 있어요.",
        variant: "success",
      });
      setFriends((prev) => prev.filter((item) => item.memberId !== memberId));
      setRequests((prev) => prev.filter((item) => item.memberId !== memberId));
      setSentRequests((prev) => prev.filter((item) => item.memberId !== memberId));
    } catch (err) {
      console.error("Failed to remove friend", err);
      show({
        title: "삭제 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "error",
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleBlock = async (memberId: string) => {
    if (!memberId || actioningId) return;
    try {
      setActioningId(memberId);
      await blockFriend(memberId);
      show({
        title: "친구가 차단되었습니다.",
        description: "필요하면 설정에서 다시 해제할 수 있어요.",
        variant: "success",
      });
      setFriends((prev) => prev.filter((item) => item.memberId !== memberId));
    } catch (err) {
      console.error("Failed to block friend", err);
      show({
        title: "차단 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "error",
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleToggleHide = (memberId: string) => {
    setHiddenIds((prev) => {
      const next = prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId];
      if (typeof window !== "undefined") {
        localStorage.setItem(HIDDEN_FRIENDS_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const handleOpenInvite = () => {
    setInviteOpen(true);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-muted">People</p>
          <h2 className="text-3xl font-semibold text-foreground">Friends</h2>
          <p className="text-sm text-muted">자주 협업하는 사람을 한 곳에서 관리하세요.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-panel/80 px-4 py-2 text-xs text-muted">
            <Users size={14} />
            <span>친구 {formatCount(friends.length)}명</span>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-lg shadow-black/20"
            onClick={handleOpenInvite}
          >
            <UserPlus size={14} />
            친구 추가
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-panel/80 p-5 shadow-[0_12px_40px_rgba(15,15,15,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Directory</p>
            <h3 className="text-lg font-semibold text-foreground">친구</h3>
            <p className="text-xs text-muted">친구 목록과 관리를 탭으로 나눴어요.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-panel/80 p-1">
            {([
              { id: "friends", label: "친구목록" },
              { id: "requests", label: "친구요청" },
              { id: "manage", label: "친구관리" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`rounded-full px-4 py-1.5 text-xs transition ${
                  activeTab === tab.id ? "bg-foreground text-background" : "text-muted hover:text-foreground"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "friends" ? (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <select
                  className="h-9 rounded-full border border-border bg-panel px-3 text-[11px] text-foreground focus:border-primary focus:outline-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "recent" | "name")}
                >
                  <option value="recent">최근 추가</option>
                  <option value="name">이름순</option>
                </select>
                <input
                  className="h-9 rounded-full border border-border bg-panel px-4 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                  placeholder="Search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {loading || searching ? (
                <div className="rounded-xl border border-border bg-panel/80 p-4 text-sm text-muted">
                  친구 목록을 불러오는 중...
                </div>
              ) : visibleFriends.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-panel/80 p-4 text-sm text-muted">
                  아직 친구가 없습니다. 친구 추가 버튼을 눌러 요청을 보내보세요.
                </div>
              ) : (
                visibleFriends.map((friend) => (
                  <div
                    key={friend.memberId}
                    className="group relative overflow-hidden rounded-[24px] border border-border bg-panel/80 px-5 py-4 transition hover:border-border/70 hover:shadow-[0_12px_30px_rgba(15,15,15,0.25)] dark:bg-gradient-to-br dark:from-black/20 dark:via-panel/90 dark:to-black/10"
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-80 dark:opacity-60">
                      <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
                    </div>
                    <div className="relative flex flex-wrap items-center justify-between gap-4">
                      <div className="flex min-w-[240px] items-center gap-4">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted/20 text-xs font-semibold text-foreground">
                          {friend.avatarUrl ? (
                            <img src={friend.avatarUrl} alt={friend.displayName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm">
                              {getInitials(friend.displayName)}
                            </div>
                          )}
                          <span
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-panel ${
                              onlineUserIds.includes(friend.userId) ? "bg-emerald-400" : "bg-slate-500"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-foreground">{friend.displayName}</p>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${
                              statusColor[onlineUserIds.includes(friend.userId) ? "online" : "offline"]
                            }`}
                          >
                            {onlineUserIds.includes(friend.userId) ? "Online" : "Offline"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full border border-border bg-panel/80 px-2 py-2 text-muted hover:border-border/70 hover:text-foreground"
                          onClick={() => {
                            window.dispatchEvent(
                              new CustomEvent("dm:open-friend", { detail: { userId: friend.userId } })
                            );
                          }}
                          aria-label="DM 보내기"
                        >
                          <MessageSquareMore size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : activeTab === "requests" ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border bg-panel/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">받은 요청</p>
                <span className="text-xs text-muted">{formatCount(requests.length)} incoming</span>
              </div>
              {loading ? (
                <div className="rounded-xl border border-border bg-panel/80 p-4 text-sm text-muted">
                  요청을 불러오는 중...
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-panel/80 p-4 text-sm text-muted">
                  받은 요청이 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {requests.map((request) => (
                    <div
                      key={request.memberId}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-panel/80 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted/20 text-xs font-semibold text-foreground">
                          {request.avatarUrl ? (
                            <img src={request.avatarUrl} alt={request.displayName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              {getInitials(request.displayName)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{request.displayName}</p>
                          <p className="text-[11px] text-muted">새로운 친구 요청</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-border/70 hover:text-foreground"
                          disabled={actioningId === request.memberId}
                          onClick={() => handleRemove(request.memberId)}
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background"
                          disabled={actioningId === request.memberId}
                          onClick={() => handleAccept(request.memberId)}
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-panel/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">보낸 요청</p>
                <span className="text-xs text-muted">{formatCount(sentRequests.length)} outgoing</span>
              </div>
              {loading ? (
                <div className="rounded-xl border border-border bg-panel/80 p-4 text-sm text-muted">
                  보낸 요청을 불러오는 중...
                </div>
              ) : sentRequests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-panel/80 p-4 text-sm text-muted">
                  보낸 요청이 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {sentRequests.map((request) => (
                    <div
                      key={request.memberId}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-panel/80 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted/20 text-xs font-semibold text-foreground">
                          {request.avatarUrl ? (
                            <img src={request.avatarUrl} alt={request.displayName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              {getInitials(request.displayName)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{request.displayName}</p>
                          <p className="text-[11px] text-muted">요청 전송됨</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-border/70 hover:text-foreground"
                        disabled={actioningId === request.memberId}
                        onClick={() => handleRemove(request.memberId)}
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <select
                  className="h-9 rounded-full border border-border bg-panel px-3 text-[11px] text-foreground focus:border-primary focus:outline-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "recent" | "name")}
                >
                  <option value="recent">최근 추가</option>
                  <option value="name">이름순</option>
                </select>
                <input
                  className="h-9 rounded-full border border-border bg-panel px-4 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                  placeholder="Search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {friends.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-panel/80 p-4 text-sm text-muted">
                  삭제할 친구가 없습니다.
                </div>
              ) : (
                orderedFriends.map((friend) => (
                  <div
                    key={friend.memberId}
                    className={`flex items-center justify-between gap-3 rounded-xl border border-border bg-panel/80 px-3 py-2 ${
                      hiddenIds.includes(friend.memberId) ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted/20 text-xs font-semibold text-foreground">
                        {friend.avatarUrl ? (
                          <img src={friend.avatarUrl} alt={friend.displayName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            {getInitials(friend.displayName)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{friend.displayName}</p>
                        <p className="text-[11px] text-muted">
                          {hiddenIds.includes(friend.memberId) ? "숨김 처리됨" : "친구"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-border px-2 py-1 text-[11px] text-muted hover:border-border/70 hover:text-foreground"
                        disabled={actioningId === friend.memberId}
                        onClick={() => handleToggleHide(friend.memberId)}
                      >
                        {hiddenIds.includes(friend.memberId) ? "Unhide" : "Hide"}
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-border px-2 py-1 text-[11px] text-muted hover:border-border/70 hover:text-foreground"
                        disabled={actioningId === friend.memberId}
                        onClick={() => handleBlock(friend.memberId)}
                      >
                        Block
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-border px-2 py-1 text-[11px] text-muted hover:border-border/70 hover:text-foreground"
                        disabled={actioningId === friend.memberId}
                        onClick={() => handleRemove(friend.memberId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="친구 추가"
        widthClass="max-w-md"
      >
        <div className="space-y-4 p-6">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Invite</p>
            <h3 className="text-lg font-semibold text-foreground">친구 요청 보내기</h3>
            <p className="text-xs text-muted">이메일 주소를 입력하세요.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="h-11 flex-1 rounded-full border border-border bg-panel px-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
              placeholder="friend@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="button"
              className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!email.trim() || sending}
              onClick={handleSendRequest}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">친구 관리</p>
            <p className="mt-2 text-xs text-muted">
              친구 관리 탭에서 요청/삭제를 확인할 수 있어요.
            </p>
          </div>
        </div>
      </Modal>
    </section>
  );
}
