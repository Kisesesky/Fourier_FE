// app/(workspace)/workspace/[teamId]/_model/hooks/useFriendsViewController.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { getChatSocket } from "@/lib/socket";
import { HIDDEN_FRIENDS_KEY } from "../constants/view.constants";
import type { FriendsTab } from "../types/view.types";
import type { FriendProfile } from "@/lib/members";
import {
  acceptIncomingFriendRequest,
  blockExistingFriend,
  listFriends,
  listPresenceOnlineUserIds,
  listReceivedFriendRequests,
  listSentFriendRequests,
  removeExistingFriend,
  requestFriendByEmail,
  searchFriendDirectory,
} from "../../_service/friends.api";

type FriendSortType = "recent" | "name";

export function useFriendsViewController(activeTabProp?: FriendsTab, onTabChange?: (tab: FriendsTab) => void) {
  const { show } = useToast();
  const { workspace } = useWorkspace();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [requests, setRequests] = useState<FriendProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendProfile[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<FriendSortType>("recent");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FriendProfile[] | null>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [internalTab, setInternalTab] = useState<FriendsTab>("friends");
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const activeTab = activeTabProp ?? internalTab;
  const setActiveTab = onTabChange ?? setInternalTab;

  const loadFriends = useCallback(async () => {
    try {
      const [friendList, requestList, sentList] = await Promise.all([
        listFriends(workspace?.id),
        listReceivedFriendRequests(workspace?.id),
        listSentFriendRequests(workspace?.id),
      ]);
      setFriends(friendList);
      setRequests(requestList);
      setSentRequests(sentList);
    } catch (error) {
      console.error("Failed to load friends", error);
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
        const ids = await listPresenceOnlineUserIds();
        if (active) setOnlineUserIds(ids);
      } catch (error) {
        console.error("Failed to load presence", error);
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
        const results = await searchFriendDirectory(normalized, workspace?.id);
        setSearchResults(results);
      } catch (error) {
        console.error("Failed to search friends", error);
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
    [hiddenIds, orderedFriends],
  );

  const handleSendRequest = async () => {
    const trimmed = email.trim();
    if (!trimmed || sending) return;
    try {
      setSending(true);
      await requestFriendByEmail(trimmed);
      setEmail("");
      show({
        title: "친구 요청을 보냈습니다.",
        description: "상대가 수락하면 친구 목록에 표시됩니다.",
        variant: "success",
      });
      await loadFriends();
    } catch (error) {
      console.error("Failed to send friend request", error);
      const message =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
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
      await acceptIncomingFriendRequest(memberId);
      show({
        title: "친구 요청을 수락했습니다.",
        description: "이제 친구 목록에서 확인할 수 있어요.",
        variant: "success",
      });
      await loadFriends();
    } catch (error) {
      console.error("Failed to accept friend", error);
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
      await removeExistingFriend(memberId);
      show({
        title: "친구가 삭제되었습니다.",
        description: "필요하면 다시 요청할 수 있어요.",
        variant: "success",
      });
      setFriends((prev) => prev.filter((item) => item.memberId !== memberId));
      setRequests((prev) => prev.filter((item) => item.memberId !== memberId));
      setSentRequests((prev) => prev.filter((item) => item.memberId !== memberId));
    } catch (error) {
      console.error("Failed to remove friend", error);
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
      await blockExistingFriend(memberId);
      show({
        title: "친구가 차단되었습니다.",
        description: "필요하면 설정에서 다시 해제할 수 있어요.",
        variant: "success",
      });
      setFriends((prev) => prev.filter((item) => item.memberId !== memberId));
    } catch (error) {
      console.error("Failed to block friend", error);
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

  return {
    friends,
    requests,
    sentRequests,
    onlineUserIds,
    loading,
    query,
    sortBy,
    searching,
    email,
    sending,
    actioningId,
    inviteOpen,
    activeTab,
    hiddenIds,
    orderedFriends,
    visibleFriends,
    setQuery,
    setSortBy,
    setEmail,
    setInviteOpen,
    setActiveTab,
    handleSendRequest,
    handleAccept,
    handleRemove,
    handleBlock,
    handleToggleHide,
  };
}
