// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/ChatView.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
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
import Drawer from "@/components/ui/Drawer";
import { useMessageSections } from "@/workspace/chat/_model/hooks/useMessageSections";
import { useChatLifecycle } from "@/workspace/chat/_model/hooks/useChatLifecycle";
import { rtbroadcast, rtlisten } from "@/lib/realtime";

const VIEWMODE_KEY = 'fd.chat.viewmode';

type ChatViewProps = {
  initialChannelId?: string;
};

function DayDivider({ ts }: { ts:number }) {
  const d = new Date(ts);
  const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  return (
    <div className="relative my-4 flex items-center">
      <div className="h-px flex-1 bg-border/80" />
      <span className="mx-3 rounded-full border border-border bg-panel/90 px-4 py-1 text-xs font-semibold text-muted">{label}</span>
      <div className="h-px flex-1 bg-border/80" />
    </div>
  );
}

function NewDivider() {
  return (
    <div className="relative my-4 flex items-center gap-2">
      <div className="flex-1 h-px bg-border" />
      <span className="px-2 py-0.5 text-xs border border-rose-400/40 bg-rose-400/10 rounded">NEW</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function ChatView({ initialChannelId }: ChatViewProps = {}) {
  const {
    me, users, channelId, channels, messages, lastReadAt, typingUsers, pinnedByChannel, savedByUser, channelMembers,
    send, setChannel, loadChannels, initRealtime, refreshChannel, updateMessage, deleteMessage, restoreMessage,
    toggleReaction, openThread, markChannelRead, setTyping,
    markUnreadAt, markSeenUpTo, togglePin, startHuddle, toggleSave,
    channelTopics
  } = useChat();
  const { show } = useToast();
  const listRef = useRef<HTMLDivElement>(null);
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
  const [view, setView] = useState<ViewMode>("cozy");
  useEffect(() => {
    if (typeof window === "undefined") return;
    setView(getStoredView());
  }, []);

  const [rightOpen, setRightOpen] = useState(false);
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
  const [cmdOpen, setCmdOpen] = useState(false);

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
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
  const [menu, setMenu] = useState<{ open:boolean; x:number; y:number; msg?: Msg; mine?: boolean }>({ open:false, x:0, y:0 });
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

  const onMenuAction = async (id: any) => {
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
        toggleReaction(m.id, "👍");
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
  const [pinOpen, setPinOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);

  // 모달: 초대/설정
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<Msg | null>(null);
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
  const quoteInline = (m: Msg) => {
    setReplyTarget(m);
  };
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

  return (
    <div className={`grid min-h-0 flex-1 ${rightOpen ? "lg:grid-cols-[minmax(0,1fr)_390px]" : ""} gap-0`}>
      <div className="flex min-h-0 flex-1 flex-col border border-border border-r-0 bg-panel/80 overflow-hidden">
        <div className="sticky top-0 z-10 bg-panel/90 backdrop-blur">
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
          className={`scroll-smooth overflow-y-auto bg-panel/80 px-2 py-1.5 space-y-1.5 scrollbar-thin ${view === 'compact' ? 'text-[13px]' : 'text-[14px]'}`}
          onClick={(e)=> {
            if ((e.target as HTMLElement).closest('[data-mid]')) return;
            if (selectMode) clearSelection();
          }}
        >
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
                  onDelete={onDelete}
                  onReact={(id, emoji) => toggleReaction(id, emoji)}
                onReply={handleOpenThread}
                  openMenu={openMenu}
                onQuoteInline={quoteInline}
                selectable={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                pinnedIds={pinnedIds}
                savedIds={savedIds}
                onPin={togglePin}
                onSave={toggleSave}
              />
            </div>
          );
        })}
        </div>

        {typingText && (
          <div className="px-4 py-2 text-xs text-muted border-t border-border bg-panel/80">{typingText}</div>
        )}

        <div
          className="border-t border-border bg-panel/80"
          onFocus={()=> onTyping(true)}
          onBlur={()=> onTyping(false)}
          onKeyDown={()=> onTyping(true)}
          onKeyUp={()=> onTyping(true)}
        >
          {replyTarget ? (
            <div className="mx-4 mt-2 rounded-xl border border-border bg-panel/90 overflow-hidden">
              <div
                className="flex w-full items-center gap-3 border-b border-border bg-panel/90 px-3 py-2.5 text-left text-[11px] text-muted transition hover:bg-panel cursor-pointer border-l-4 border-l-indigo-500"
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
                <span className="h-9 w-9 overflow-hidden rounded-full bg-muted/20 text-[12px] font-semibold text-foreground">
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
                    <div className="flex items-center gap-2 uppercase tracking-[0.18em] text-indigo-500">
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
                  <div className="truncate text-[11px] text-muted">{replyTarget.text || ""}</div>
                </div>
              </div>
              <Composer
                variant="merged"
                onSend={async (text, files, extra) => {
                  await send(text, files, { ...extra, replyToId });
                  setReplyTarget(null);
                }}
              />
            </div>
          ) : (
            <Composer
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
      </div>
      {rightOpen && (
        <aside className="hidden h-full min-h-0 overflow-hidden border border-border border-l bg-panel/80 lg:block">
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
