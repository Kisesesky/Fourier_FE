// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/ChatView.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { CornerDownRight } from "lucide-react";
import { useChat } from "@/workspace/chat/_model/store";
import type { Msg, ViewMode } from "@/workspace/chat/_model/types";
import { useToast } from "@/components/ui/Toast";
import Composer from "./Composer";
import MessageContextMenu from "./MessageContextMenu";
import HuddleBar from "./HuddleBar";
import PinManager from "./PinManager";
import SavedModal from "./SavedModal";
import { InviteModal } from "./ChannelModals";
import ChannelSettingsModal from "./ChannelSettingsModal";
import CommandPalette from "./CommandPalette";
import LightboxHost from "./Lightbox";
import LiveReadersBar, { broadcastReadCursor } from "./LiveReadersBar";
import { MessageGroup } from "./MessageGroup";
import { ChatHeader } from "./ChatHeader";
import { ChatSelectionBar } from "./SelectionBar";
import ChatRightPanel from "./ChatRightPanel";
import UserProfileModal from "./UserProfileModal";
import Drawer from "@/components/ui/Drawer";
import { useParams, useRouter } from "next/navigation";
import { useMessageSections } from "@/workspace/chat/_model/hooks/useMessageSections";
import { useChatLifecycle } from "@/workspace/chat/_model/hooks/useChatLifecycle";
import { rtbroadcast, rtlisten } from "@/lib/realtime";
import { useChatViewUiStore } from "@/workspace/chat/_model/store/useChatViewUiStore";

const VIEWMODE_KEY = 'fd.chat.viewmode';

type ChatViewProps = {
  initialChannelId?: string;
};

function ChannelIntro({
  channelName,
  createdAt,
}: {
  channelName: string;
  createdAt: number;
}) {
  const d = new Date(createdAt);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return (
    <div className="mb-4 rounded-xl border-b-2 px-4 py-4">
      <h1 className="text-4xl font-semibold text-foreground"># {channelName}에 오신 걸 환영합니다!</h1>
      <h3 className="mt-1 text-xl text-muted"># {channelName} 채널의 맨 첫 부분입니다.</h3>
      <h4 className="mt-1 text-sm text-muted"> - 생성한 날짜는 {yyyy}년 {mm}월 {dd}일입니다.</h4>
    </div>
  );
}

function DayDivider({ ts }: { ts:number }) {
  const d = new Date(ts);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((startOfToday.getTime() - startOfTarget.getTime()) / (1000 * 60 * 60 * 24));
  const relativeLabel =
    diffDays === 0
      ? "오늘"
      : diffDays === 1
        ? "어제"
        : diffDays < 7
          ? `${diffDays}일 전`
          : diffDays < 30
            ? `${Math.floor(diffDays / 7)}주 전`
            : diffDays < 365
              ? `${Math.floor(diffDays / 30)}달 전`
              : "1년 이상";
  const absoluteLabel = `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}`;
  return (
    <div className="my-4 flex items-center gap-3 py-1">
      <div className="h-0 flex-1 border-t border-border/80" />
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-200">
          {relativeLabel}
        </span>
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted/70">{absoluteLabel}</span>
      </div>
      <div className="h-0 flex-1 border-t border-border/80" />
    </div>
  );
}

function NewDivider() {
  return (
    <div className="relative my-4 flex items-center gap-2">
      <div className="h-px flex-1 bg-slate-300/30" />
      <span className="px-1 text-xs font-semibold text-muted">NEW</span>
      <div className="h-px flex-1 bg-slate-300/30" />
    </div>
  );
}

export default function ChatView({ initialChannelId }: ChatViewProps = {}) {
  const {
    me, users, channelId, channels, messages, lastReadAt, typingUsers, pinnedByChannel, savedByUser, channelMembers,
    send, setChannel, loadChannels, initRealtime, refreshChannel, updateMessage, deleteMessage, restoreMessage,
    toggleReaction, openThread, markChannelRead, setTyping,
    markUnreadAt, markSeenUpTo, togglePin, startHuddle, toggleSave, startGroupDM,
    channelTopics
  } = useChat();
  const router = useRouter();
  const { teamId, projectId } = useParams<{ teamId: string; projectId: string }>();
  const { show } = useToast();
  const listRef = useRef<HTMLDivElement>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileAnchorRect, setProfileAnchorRect] = useState<{ top: number; left: number; right: number; bottom: number } | null>(null);
  const handleMention = useCallback(
    (author: string, text: string | undefined) => {
      show({
        variant: 'success',
        title: '멘션',
        description: `${author}: "${(text || '').slice(0, 80)}"`,
      });
    },
    [show],
  );

  const getStoredView = () => {
    if (typeof window === "undefined") return "cozy" as ViewMode;
    const stored = localStorage.getItem(VIEWMODE_KEY) as ViewMode | null;
    return stored === "compact" ? "compact" : "cozy";
  };
  const {
    view,
    setView,
    rightOpen,
    setRightOpen,
    cmdOpen,
    setCmdOpen,
    selectMode,
    setSelectMode,
    selectedIds,
    setSelectedIds,
    menu,
    setMenu,
    pinOpen,
    setPinOpen,
    savedOpen,
    setSavedOpen,
    inviteOpen,
    setInviteOpen,
    settingsOpen,
    setSettingsOpen,
    replyTarget,
    setReplyTarget,
    resetChatViewUiState,
  } = useChatViewUiStore();

  useEffect(() => {
    resetChatViewUiState();
  }, [resetChatViewUiState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setView(getStoredView());
  }, []);

  useEffect(() => {
    const handleOpen = () => setRightOpen(true);
    const handleClose = () => setRightOpen(false);
    window.addEventListener("chat:open-right", handleOpen);
    window.addEventListener("chat:close-right", handleClose);
    return () => {
      window.removeEventListener("chat:open-right", handleOpen);
      window.removeEventListener("chat:close-right", handleClose);
    };
  }, []);

  /** 커맨드 팔레트 */
  useEffect(() => {
    if (!initialChannelId) return;
    if (channelId === initialChannelId) return;
    const isDm = initialChannelId.startsWith("dm:");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      initialChannelId,
    );
    const exists = channels.some((c) => c.id === initialChannelId);
    if (!isDm && !isUuid && !exists) return;
    void setChannel(initialChannelId);
  }, [initialChannelId, channelId, channels, setChannel]);

  useEffect(() => {
    setReplyTarget(null);
  }, [channelId]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
      if ((isMac && e.metaKey && e.key.toLowerCase() === 'k') || (!isMac && e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (!detail?.id) return;
      const container = listRef.current;
      if (!container) return;
      const target = container.querySelector<HTMLElement>(`[data-mid="${detail.id}"]`);
      if (!target) return;
      target.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    window.addEventListener("chat:scroll-to", handler as EventListener);
    return () => {
      window.removeEventListener("chat:scroll-to", handler as EventListener);
    };
  }, [listRef]);

  /** 멀티선택 상태 */
  const toggleSelect = (id: string, multi?: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    if (!multi) setSelectMode(true);
  };
  const clearSelection = () => { setSelectMode(false); setSelectedIds(new Set()); };

  const scrollInto = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };



  const onDelete = (id: string) => {
    const msg = messages.find(m => m.id === id);
    // 방어: 내 메시지가 아니면 삭제 불가
    if (msg && msg.authorId !== me.id) {
      show({ variant: 'error', title: '삭제 불가', description: '자신이 작성한 메시지만 삭제할 수 있습니다.' });
      return;
    }
    const { deleted } = deleteMessage(id);
    if (!deleted) return;
    show({
      title: "메시지를 삭제했습니다",
      description: "되돌리려면 Undo를 누르세요.",
      actionLabel: "Undo",
      onAction: () => restoreMessage(deleted),
    });
  };

  // 컨텍스트 메뉴
  
  const openMenu = (e: MouseEvent<HTMLElement>, m: Msg, mine: boolean) => {
    setMenu({ open:true, x: e.clientX, y: e.clientY, msg: m, mine });
  };
  const closeMenu = () => setMenu({ open:false, x:0, y:0 });
  const typingList = typingUsers[channelId] || [];
  const typingText = typingList.length ? `${typingList.join(", ")} is typing...` : "";
  const lastReadTs = lastReadAt[channelId] || 0;
  const { sections, otherSeen } = useMessageSections({
    messages,
    lastReadTs,
    meId: me.id,
    users,
  });

  const onMenuAction = async (id: any, payload?: { emoji?: string }) => {
    const m = menu.msg!;
    const isMine = m.authorId === me.id;

    switch (id) {
      case 'reply':
      case 'open-thread':
        if (isDM) {
          show({ variant: 'error', title: '스레드 불가', description: 'DM 메시지에는 스레드를 만들 수 없습니다.' });
          break;
        }
        openThread(m.parentId ? (m.parentId as string) : m.id);
        window.dispatchEvent(new Event('chat:open-right'));
        break;
      case 'react':
        toggleReaction(m.id, payload?.emoji || "👍");
        break;
      case 'copy':
        await navigator.clipboard.writeText(m.text || "");
        show({ title: "복사됨", description: "메시지 텍스트를 복사했어요." });
        break;
      case 'quote': {
        setReplyTarget(m);
        break;
      }
      case 'link': {
        const url = `${location.origin}/chat#${m.id}`;
        await navigator.clipboard.writeText(url);
        show({ title: "링크 복사됨", description: url });
        break;
      }
      case 'pin':
        togglePin(m.id);
        show({ title: "핀 고정", description: "이 메시지를 채널 상단에 고정했습니다." });
        break;
      case 'unpin':
        togglePin(m.id);
        show({ title: "핀 해제", description: "고정된 메시지를 해제했습니다." });
        break;
      case 'unread':
        markUnreadAt(m.ts, m.channelId);
        setTimeout(() => scrollInto(m.id), 50);
        break;
      case 'save':
        toggleSave(m.id);
        show({ title: "저장됨", description: "Saved messages에 추가했습니다." });
        break;
      case 'unsave':
        toggleSave(m.id);
        show({ title: "해제됨", description: "Saved messages에서 제거했습니다." });
        break;
      case 'edit':
        if (!isMine) {
          show({ variant: 'error', title: '편집 불가', description: '자신의 메시지만 편집할 수 있습니다.' });
          break;
        }
        // 힌트만: 실제 편집은 메시지 hover 툴에서 가능
        show({ title: "편집 모드", description: "메시지 줄의 연필 아이콘을 누르세요." });
        break;
      case 'delete':
        if (!isMine) {
          show({ variant: 'error', title: '삭제 불가', description: '자신의 메시지만 삭제할 수 있습니다.' });
          break;
        }
        onDelete(m.id);
        break;
      case 'huddle':
        startHuddle(m.channelId);
        show({ title: "Huddle 시작", description: `#${m.channelId} 에서 음성 허들을 시작했습니다 (MVP).` });
        break;
    }
    closeMenu();
  };

  const onTyping = (typing: boolean) => {
    setTyping(typing);
    rtbroadcast({ type: 'typing', channelId, userId: me.id, userName: me.name, on: typing });
  };
  // 모달: 초대/설정
  const replyToId = replyTarget?.id;

  const currentChannel = useMemo(() => channels.find(c => c.id === channelId), [channels, channelId]);
  const isDM = channelId.startsWith("dm:");
  const dmParticipantIds = useMemo(() => {
    if (!isDM) return [] as string[];
    const fromMembers = (channelMembers[channelId] || []).filter(Boolean);
    if (fromMembers.length > 0) return fromMembers;
    const raw = channelId.slice(3);
    return raw ? raw.split("+").filter(Boolean) : [];
  }, [channelId, channelMembers, isDM]);
  const dmOtherId = useMemo(
    () => dmParticipantIds.find((id) => id !== me.id) ?? dmParticipantIds[0],
    [dmParticipantIds, me.id],
  );
  const dmUser = isDM && dmOtherId ? users[dmOtherId] : undefined;
  const channelLabel = isDM
    ? (dmUser?.name ?? currentChannel?.name?.replace(/^@\s*/, "") ?? "Direct Message")
    : (currentChannel?.name ?? channelId ?? "Channel");
  const memberIds = useMemo(() => {
    if (isDM) {
      return Array.from(new Set([me.id, ...dmParticipantIds].filter(Boolean) as string[]));
    }
    const ids = channelMembers[channelId] || [];
    if (ids.length > 0) return ids;
    return Object.keys(users);
  }, [channelMembers, channelId, dmParticipantIds, isDM, me.id, users]);
  const memberNames = useMemo(
    () => memberIds.map((id) => users[id]?.name || id),
    [memberIds, users],
  );
  const topic = channelTopics[channelId]?.topic || "";
  const channelDisplayName = isDM ? channelLabel : channelLabel.replace(/^#\s*/, "#");
  const normalizedChannelName = channelDisplayName.replace(/^[@#]\s*/, "");
  const fallbackCreatedAt = useMemo(() => {
    const values = messages.map((m) => m.ts).filter((v) => Number.isFinite(v));
    if (values.length === 0) return Date.now();
    return Math.min(...values);
  }, [messages]);
  const channelCreatedAtMs = useMemo(() => {
    const raw = currentChannel?.createdAt;
    if (!raw) return fallbackCreatedAt;
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? fallbackCreatedAt : parsed;
  }, [currentChannel?.createdAt, fallbackCreatedAt]);
  const pinnedIds = useMemo(() => new Set(pinnedByChannel[channelId] || []), [pinnedByChannel, channelId]);
  const savedIds = useMemo(() => new Set(savedByUser[me.id] || []), [savedByUser, me.id]);
  const replyMetaMap = useMemo(() => {
    const map: Record<string, { count: number; lastTs?: number; lastAuthorId?: string }> = {};
    messages.forEach((m) => {
      if (!m.parentId) return;
      const curr = map[m.parentId] || { count: 0 };
      const nextCount = curr.count + 1;
      const nextLastTs = !curr.lastTs || m.ts > curr.lastTs ? m.ts : curr.lastTs;
      const nextLastAuthorId = !curr.lastTs || m.ts > curr.lastTs ? m.authorId : curr.lastAuthorId;
      map[m.parentId] = { count: nextCount, lastTs: nextLastTs, lastAuthorId: nextLastAuthorId };
    });
    return map;
  }, [messages]);

  const handleOpenThread = useCallback(
    (rootId: string) => {
      if (isDM) {
        show({ variant: 'error', title: '스레드 불가', description: 'DM 메시지에는 스레드를 만들 수 없습니다.' });
        return;
      }
      openThread(rootId);
      window.dispatchEvent(new Event('chat:open-right'));
    },
    [isDM, openThread, show],
  );

  /** 일괄 작업 */
  const batchPin = () => { selectedIds.forEach(id => togglePin(id)); clearSelection(); };
  const batchSave = () => { selectedIds.forEach(id => toggleSave(id)); clearSelection(); };
  const batchDelete = () => {
    for (const id of selectedIds) {
      const msg = messages.find(m => m.id === id);
      if (!msg || msg.authorId !== me.id) continue; // 내 메시지만 삭제
      onDelete(id);
    }
    clearSelection();
  };
  const batchReact = (emoji: string) => { selectedIds.forEach(id => toggleReaction(id, emoji)); clearSelection(); };

  /** 브로드캐스트 수신 (타이핑 등) */
  useEffect(() => {
    const un = rtlisten((ev) => {
      if (ev.type === 'typing' && ev.channelId === channelId && ev.userId !== me.id) {
        // store의 typingUsers가 이미 있다면 거기로 반영되어 있을 것이고,
        // 없더라도 UI에 영향은 미미 (현재는 store 우선)
      }
    });
    return () => un();
  }, [channelId, me.id]);

  useChatLifecycle({
    channelId,
    messages,
    listRef,
    initRealtime,
    loadChannels,
    setChannel,
    refreshChannel,
    markChannelRead,
    markSeenUpTo,
    me,
    onMention: handleMention,
    broadcastRead: broadcastReadCursor,
  });

  useEffect(() => {
    const onOpenProfile = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId?: string; anchorRect?: { top: number; left: number; right: number; bottom: number } }>;
      const userId = customEvent.detail?.userId;
      if (!userId) return;
      setProfileAnchorRect(customEvent.detail?.anchorRect ?? null);
      setProfileUserId(userId);
    };
    window.addEventListener("chat:open-user-profile", onOpenProfile as EventListener);
    return () => {
      window.removeEventListener("chat:open-user-profile", onOpenProfile as EventListener);
    };
  }, []);

  const profileUser = profileUserId ? users[profileUserId] : undefined;
  const handleSendProfileDm = useCallback(
    async ({ userId, text }: { userId: string; text: string }) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (userId === me.id) {
        show({ variant: "error", title: "전송 실패", description: "본인에게는 DM을 보낼 수 없습니다." });
        return;
      }
      const dmChannelId = startGroupDM([userId]);
      if (!dmChannelId) {
        show({ variant: "error", title: "DM 생성 실패", description: "DM 채널을 만들지 못했습니다." });
        return;
      }
      await setChannel(dmChannelId);
      await send(trimmed);
      setProfileUserId(null);
    },
    [me.id, send, setChannel, show, startGroupDM],
  );
  const handleOpenFullProfile = useCallback(
    (userId: string) => {
      if (!teamId || !projectId) return;
      router.push(`/workspace/${teamId}/${projectId}/members?memberId=${encodeURIComponent(userId)}&profile=open`);
    },
    [projectId, router, teamId],
  );

  return (
    <div className={`grid min-h-0 flex-1 ${rightOpen ? "lg:grid-cols-[minmax(0,1fr)_390px]" : ""} gap-0`}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-l-2xl border border-border/70 border-r-0 bg-panel/85">
        <div className="sticky top-0 z-10 bg-panel/95 backdrop-blur">
          <HuddleBar channelId={channelId} />
          <LiveReadersBar meId={me.id} channelId={channelId} />
          <ChatHeader
            isDM={isDM}
            channelName={channelDisplayName}
            dmAvatarUrl={dmUser?.avatarUrl}
            memberNames={memberNames}
            memberIds={memberIds}
            users={users}
            topic={topic}
            view={view}
            onOpenInvite={() => setInviteOpen(true)}
            onOpenCmd={() => setCmdOpen(true)}
            onOpenPins={() => setPinOpen(true)}
            onOpenSaved={() => setSavedOpen(true)}
            onLeaveChannel={() => show({ title: "채팅방 나가기", description: "준비중입니다." })}
            onKickMember={() => show({ title: "멤버 강퇴", description: "준비중입니다." })}
            onBlockMember={() => show({ title: "차단하기", description: "준비중입니다." })}
            onOpenNotifications={() => show({ title: "알람 설정", description: "준비중입니다." })}
            pinCount={(pinnedByChannel[channelId]?.length || 0)}
            savedCount={(savedByUser[me.id]?.length || 0)}
          />
          <ChatSelectionBar
            count={selectMode ? selectedIds.size : 0}
            onPin={batchPin}
            onSave={batchSave}
            onDelete={batchDelete}
            onReact={batchReact}
            onClear={clearSelection}
          />
        </div>

        <div
          ref={listRef}
          className={`scroll-smooth overflow-y-auto bg-background/35 px-4 py-3 pb-8 space-y-2 scrollbar-thin ${view === 'compact' ? 'text-[13px]' : 'text-[14px]'}`}
          onClick={(e)=> {
            if ((e.target as HTMLElement).closest('[data-mid]')) return;
            if (selectMode) clearSelection();
          }}
        >
          <ChannelIntro channelName={normalizedChannelName} createdAt={channelCreatedAtMs} />
          {sections.map((section) => {
            const { head, items, showDayDivider, showNewDivider } = section;
            return (
              <div key={head.id} id={head.id}>
                {showDayDivider && <DayDivider ts={head.ts} />}
                {showNewDivider && <NewDivider />}
                <MessageGroup
                  items={items}
                  isMine={head.authorId === me.id}
                  view={view}
                  meId={me.id}
                  otherSeen={otherSeen}
                  users={users}
                  threadMetaMap={replyMetaMap}
                  onEdit={(id, text) => {
                    const msg = messages.find((m) => m.id === id);
                    if (msg && msg.authorId !== me.id) {
                      show({ variant: 'error', title: '권한 없음', description: '자신의 메시지만 수정할 수 있습니다.' });
                      return;
                    }
                    updateMessage(id, { text });
                  }}
                  onReact={(id, emoji) => toggleReaction(id, emoji)}
                onReply={handleOpenThread}
                  onQuote={(msg) => setReplyTarget(msg)}
                  openMenu={openMenu}
                selectable={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                pinnedIds={pinnedIds}
                savedIds={savedIds}
                onPin={togglePin}
                onSave={toggleSave}
                onDelete={onDelete}
                onOpenProfile={(userId, anchorRect) => {
                  setProfileAnchorRect(anchorRect ?? null);
                  setProfileUserId(userId);
                }}
              />
            </div>
          );
        })}
        </div>

        {typingText && (
          <div className="border-t border-border/70 bg-panel/80 px-4 py-2 text-xs text-muted">{typingText}</div>
        )}

        <div
          className="sticky bottom-0 z-10 border-t border-border/70 bg-gradient-to-t from-background via-background/95 to-background/75 backdrop-blur"
          onFocus={()=> onTyping(true)}
          onBlur={()=> onTyping(false)}
          onKeyDown={()=> onTyping(true)}
          onKeyUp={()=> onTyping(true)}
        >
          {replyTarget ? (
            <div className="mx-4 mt-2 overflow-hidden rounded-xl border border-border bg-panel/90">
              <div
                className="flex w-full cursor-pointer items-center gap-2.5 border-b border-border bg-panel/90 px-3 py-2 text-left text-[11px] text-muted transition hover:bg-panel"
                role="button"
                tabIndex={0}
                onClick={() => {
                  const ev = new CustomEvent("chat:scroll-to", { detail: { id: replyTarget.id } });
                  window.dispatchEvent(ev);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    const ev = new CustomEvent("chat:scroll-to", { detail: { id: replyTarget.id } });
                    window.dispatchEvent(ev);
                  }
                }}
              >
                <span className="h-8 w-8 overflow-hidden rounded-full bg-muted/20 text-[11px] font-semibold text-foreground">
                  {users[replyTarget.authorId]?.avatarUrl ? (
                    <img
                      src={users[replyTarget.authorId].avatarUrl}
                      alt={replyTarget.author}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      {replyTarget.author.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-[10px] text-muted">
                    <div className="flex items-center gap-1.5 uppercase tracking-[0.16em] text-indigo-500">
                      <CornerDownRight size={11} />
                      Replying to <span className="font-semibold text-foreground normal-case">{replyTarget.author}</span>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-border px-2 py-0.5 text-[12px] text-muted hover:text-foreground"
                      onClick={(event) => {
                        event.stopPropagation();
                        setReplyTarget(null);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="truncate text-[10.5px] text-muted">{replyTarget.text || ""}</div>
                </div>
              </div>
              <Composer
                variant="merged"
                placeholder={`#${normalizedChannelName}에 답장 보내기`}
                onSend={async (text, files, extra) => {
                  await send(text, files, { ...extra, replyToId });
                  setReplyTarget(null);
                }}
              />
            </div>
          ) : (
            <Composer
              placeholder={`#${normalizedChannelName}에 메시지 보내기`}
              onSend={async (text, files, extra) => {
                await send(text, files, { ...extra, replyToId });
                setReplyTarget(null);
              }}
            />
          )}
        </div>

        <MessageContextMenu
          open={menu.open}
          x={menu.x}
          y={menu.y}
          canEdit={!!(menu.msg && menu.msg.authorId === me.id)}
          pinned={menu.msg ? ((pinnedByChannel[channelId] || []).includes(menu.msg.id)) : false}
          saved={menu.msg ? ((savedByUser[me.id] || []).includes(menu.msg.id)) : false}
          onAction={onMenuAction}
          onClose={closeMenu}
        />

        <PinManager open={pinOpen} onOpenChange={setPinOpen} />
        <SavedModal open={savedOpen} onOpenChange={setSavedOpen} />

        {!channelId.startsWith("dm:") && (
          <>
            <InviteModal open={inviteOpen} onOpenChange={setInviteOpen} channelId={channelId} />
            <ChannelSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} channelId={channelId} />
          </>
        )}

        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
        <LightboxHost />
        <UserProfileModal
          open={!!profileUser}
          user={profileUser}
          anchorRect={profileAnchorRect ?? undefined}
          currentUserId={me.id}
          onClose={() => {
            setProfileUserId(null);
            setProfileAnchorRect(null);
          }}
          onSendDm={handleSendProfileDm}
          onEditProfile={handleOpenFullProfile}
          onOpenFullProfile={handleOpenFullProfile}
          onIgnore={(userId) => {
            const userName = users[userId]?.displayName || users[userId]?.name || "사용자";
            show({ title: "무시하기", description: `${userName} 사용자 무시하기는 준비중입니다.` });
          }}
          onBlock={(userId) => {
            const userName = users[userId]?.displayName || users[userId]?.name || "사용자";
            show({ title: "차단하기", description: `${userName} 사용자 차단하기는 준비중입니다.` });
          }}
        />
      </div>
      {rightOpen && (
        <aside className="hidden h-full min-h-0 overflow-hidden rounded-r-2xl border border-border/70 border-l bg-panel/85 lg:block">
          <ChatRightPanel />
        </aside>
      )}
      <Drawer
        open={rightOpen}
        onOpenChange={(open) => {
          if (!open) {
            window.dispatchEvent(new Event("chat:close-right"));
          }
        }}
        title="Thread"
        width={360}
        side="right"
      >
        <ChatRightPanel />
      </Drawer>
    </div>
  );
}
