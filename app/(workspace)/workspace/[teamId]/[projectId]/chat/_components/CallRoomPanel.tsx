// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/CallRoomPanel.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Grid3X3,
  Mic,
  MicOff,
  PhoneOff,
  Square,
} from 'lucide-react';
import { useChat } from '@/workspace/chat/_model/store';
import { getChatSocket } from '@/lib/socket';
import { useToast } from '@/components/ui/Toast';
import type { ChatUser, FileItem } from '@/workspace/chat/_model/types';
import { CallControlsDock } from './call-room/_components/CallControlsDock';
import { CallSidePanel } from './call-room/_components/CallSidePanel';
import { CallStage } from './call-room/_components/CallStage';
import { useCallRoomConnection } from './call-room/_model/hooks/useCallRoomConnection';

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-6 w-6 overflow-hidden rounded-full border border-border bg-subtle/80 text-[10px] font-semibold text-muted">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center">{initials}</span>
      )}
    </div>
  );
}

export default function CallRoomPanel({
  channelId,
  channelName,
  variant = 'bar',
}: {
  channelId: string;
  channelName?: string;
  variant?: 'bar' | 'panel';
}) {
  const { huddles, stopHuddle, toggleHuddleMute, users, me, messages, send } = useChat();
  const { show } = useToast();
  const h = huddles[channelId];

  const floatingPanelRef = useRef<HTMLDivElement | null>(null);
  const [panelTab, setPanelTab] = useState<'chat' | 'participants'>('participants');
  const [focusTileId, setFocusTileId] = useState<string | null>(null);
  const [gridMode, setGridMode] = useState(false);
  const [sideOpen, setSideOpen] = useState(true);
  const [videoPage, setVideoPage] = useState(1);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [micVolume, setMicVolume] = useState(100);
  const [speakerVolume, setSpeakerVolume] = useState(100);
  const [pendingHostAction, setPendingHostAction] = useState<{
    type: 'force-mute' | 'kick';
    targetUserId: string;
    name: string;
  } | null>(null);

  const sfuDebugEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('fd.sfu.debug') === '1';
  }, []);

  const socket = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return getChatSocket(localStorage.getItem('accessToken'));
  }, []);

  const {
    localVideoRef,
    localStreamRef,
    localCameraPreviewStreamRef,
    localScreenPreviewStreamRef,
    cameraOn,
    isScreenSharing,
    remoteVisualStreams,
    mediaStateByUser,
    speakingByUser,
    sfuAccess,
    sfuState,
    sfuLogs,
    toggleCamera,
    toggleScreenShare,
    handleToggleMute,
    handleDisconnectCall,
    hostForceMute,
    hostKick,
  } = useCallRoomConnection({
    channelId,
    huddle: h,
    meId: me.id,
    socket,
    sfuDebugEnabled,
    micVolume,
    onToggleHuddleMute: toggleHuddleMute,
    onStopHuddle: stopHuddle,
    onNotify: show,
  });

  useEffect(() => {
    if (!h?.active) return;
    if (focusTileId?.startsWith('user:')) return;
    const allIds: string[] = [];
    const screenIds: string[] = [];
    if (localScreenPreviewStreamRef.current && isScreenSharing) {
      screenIds.push(`${me.id}:screen`);
      allIds.push(`${me.id}:screen`);
    }
    if (localCameraPreviewStreamRef.current && cameraOn) {
      allIds.push(`${me.id}:camera`);
    }
    Object.entries(remoteVisualStreams).forEach(([userId, streams]) => {
      if (streams.screen) {
        screenIds.push(`${userId}:screen`);
        allIds.push(`${userId}:screen`);
      }
      if (streams.video) allIds.push(`${userId}:camera`);
    });
    if (focusTileId && allIds.includes(focusTileId)) return;
    setFocusTileId(screenIds[0] || null);
  }, [
    cameraOn,
    focusTileId,
    h?.active,
    isScreenSharing,
    localCameraPreviewStreamRef,
    localScreenPreviewStreamRef,
    me.id,
    remoteVisualStreams,
  ]);

  useEffect(() => {
    if (!sideOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSideOpen(false);
    };
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-call-panel-toggle="true"]')) return;
      if (floatingPanelRef.current?.contains(target)) return;
      setSideOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [sideOpen]);

  const callMessages = useMemo(
    () =>
      messages
        .filter((message) => message.channelId === channelId && !message.parentId)
        .slice(-40),
    [channelId, messages],
  );

  const formatCallMessageTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });

  if (!h?.active) return null;

  const dur = h.startedAt ? Math.max(0, Math.floor((Date.now() - h.startedAt) / 1000)) : 0;
  const mm = String(Math.floor(dur / 60)).padStart(2, '0');
  const ss = String(dur % 60).padStart(2, '0');

  const sendCallMessage = async (text: string, files?: FileItem[], extra?: { mentions?: string[]; parentId?: string | null }) => {
    const trimmed = text.trim();
    if (!trimmed && (!files || files.length === 0)) return;
    await send(trimmed, files, { mentions: extra?.mentions, parentId: extra?.parentId ?? undefined });
  };

  const toggleFloatingPanel = (nextTab: 'chat' | 'participants') => {
    if (panelTab === nextTab) {
      setSideOpen((prev) => !prev);
      return;
    }
    setPanelTab(nextTab);
    setSideOpen(true);
  };

  if (variant === 'panel') {
    const displayParticipantIds = Array.from(new Set([me.id, ...(h.members || []), ...Object.keys(remoteVisualStreams)]));
    const callUsers: Record<string, ChatUser> = users;
    const participants = displayParticipantIds.map((id) => {
      const user = callUsers[id];
      return {
        id,
        displayName: user?.displayName || user?.name || '사용자',
        avatarUrl: user?.avatarUrl,
        stream: id === me.id ? localStreamRef.current : remoteVisualStreams[id]?.video,
        isMe: id === me.id,
      };
    });

    const visualTiles = [
      ...(localScreenPreviewStreamRef.current
        ? [
            {
              id: `${me.id}:screen`,
              userId: me.id,
              displayName: callUsers[me.id]?.displayName || callUsers[me.id]?.name || '사용자',
              avatarUrl: callUsers[me.id]?.avatarUrl,
              stream: localScreenPreviewStreamRef.current,
              source: 'screen' as const,
              isMe: true,
            },
          ]
        : []),
      ...(localCameraPreviewStreamRef.current
        ? [
            {
              id: `${me.id}:camera`,
              userId: me.id,
              displayName: callUsers[me.id]?.displayName || callUsers[me.id]?.name || '사용자',
              avatarUrl: callUsers[me.id]?.avatarUrl,
              stream: localCameraPreviewStreamRef.current,
              source: 'camera' as const,
              isMe: true,
            },
          ]
        : []),
      ...Object.entries(remoteVisualStreams).flatMap(([userId, streams]) => {
        const displayName = callUsers[userId]?.displayName || callUsers[userId]?.name || '사용자';
        const avatarUrl = callUsers[userId]?.avatarUrl;
        const tiles: Array<{
          id: string;
          userId: string;
          displayName: string;
          avatarUrl?: string;
          stream: MediaStream;
          source: 'camera' | 'screen';
          isMe: boolean;
        }> = [];
        if (streams.screen) {
          tiles.push({ id: `${userId}:screen`, userId, displayName, avatarUrl, stream: streams.screen, source: 'screen', isMe: false });
        }
        if (streams.video) {
          tiles.push({ id: `${userId}:camera`, userId, displayName, avatarUrl, stream: streams.video, source: 'camera', isMe: false });
        }
        return tiles;
      }),
    ];

    return (
      <div className="h-full min-h-full overflow-hidden bg-background">
        <video ref={localVideoRef} autoPlay muted playsInline className="hidden" />
        <div className="relative h-full min-h-full">
          <div className="mt-1 flex h-full min-h-0 flex-col px-2 pb-24 pt-1">
            <div className="mb-2 flex h-12 items-center justify-between border-b border-border/70 px-1">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Mic size={15} />
                <span className="font-semibold">{channelName || '채널'}</span>
                <div className="ml-1 flex items-center gap-1">
                  {displayParticipantIds.map((memberId, i) => {
                    const user = callUsers[memberId];
                    const displayName = user?.name ?? memberId;
                    return <Avatar key={`${memberId}-${i}`} name={displayName} avatarUrl={user?.avatarUrl} />;
                  })}
                </div>
                <span className="ml-1 text-xs text-muted">{displayParticipantIds.length}명 참가</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-panel text-foreground hover:bg-subtle/60"
                  onClick={() => setGridMode((prev) => !prev)}
                  title={gridMode ? '메인+사이드 보기' : '그리드 보기'}
                >
                  {gridMode ? <Square size={14} /> : <Grid3X3 size={14} />}
                </button>
              </div>
            </div>
            <CallStage
              gridMode={gridMode}
              visualTiles={visualTiles}
              audioParticipants={participants}
              focusTileId={focusTileId}
              mediaStateByUser={mediaStateByUser}
              listenerStateByUser={{ [me.id]: isDeafened }}
              speakingByUser={speakingByUser}
              videoPage={videoPage}
              speakerVolume={isDeafened ? 0 : Math.max(0, Math.min(1, speakerVolume / 100))}
              onVideoPageChange={setVideoPage}
              onFocusTile={setFocusTileId}
            />
          </div>

          <CallSidePanel
            open={sideOpen}
            panelTab={panelTab}
            participantIds={displayParticipantIds}
            users={callUsers}
            meId={me.id}
            callMessages={callMessages}
            mediaStateByUser={mediaStateByUser}
            formatCallMessageTime={formatCallMessageTime}
            panelRef={floatingPanelRef}
            onClose={() => setSideOpen(false)}
            onSendMessage={sendCallMessage}
            onRequestHostAction={setPendingHostAction}
            hostControlsEnabled={sfuState.enabled && sfuAccess?.callRole === 'host'}
          />
          <CallControlsDock
            controlsCollapsed={controlsCollapsed}
            muted={!!h.muted}
            isDeafened={isDeafened}
            cameraOn={cameraOn}
            isScreenSharing={isScreenSharing}
            muteDisabled={!!(sfuState.enabled && sfuAccess && !sfuAccess.canProduce)}
            cameraDisabled={!!(sfuState.enabled && sfuAccess && !sfuAccess.canUseVideo)}
            screenShareDisabled={!!(sfuState.enabled && sfuAccess && !sfuAccess.canShareScreen)}
            chatPanelActive={sideOpen && panelTab === 'chat'}
            participantsPanelActive={sideOpen && panelTab === 'participants'}
            chatCount={callMessages.length}
            participantCount={displayParticipantIds.length}
            micVolume={micVolume}
            speakerVolume={speakerVolume}
            onToggleCollapsed={() => setControlsCollapsed((prev) => !prev)}
            onToggleMute={handleToggleMute}
            onToggleDeafened={() => setIsDeafened((prev) => !prev)}
            onToggleCamera={() => void toggleCamera()}
            onToggleScreenShare={() => void toggleScreenShare()}
            onDisconnect={handleDisconnectCall}
            onToggleChatPanel={() => toggleFloatingPanel('chat')}
            onToggleParticipantsPanel={() => toggleFloatingPanel('participants')}
            onMicVolumeChange={setMicVolume}
            onSpeakerVolumeChange={setSpeakerVolume}
          />
          {sfuDebugEnabled && (
            <div className="pointer-events-none fixed bottom-4 left-4 z-20 w-[320px] max-w-[calc(100vw-1.5rem)]">
              <div className="rounded-xl border border-border bg-background/95 p-2 shadow-lg">
                <div className="mb-1 text-[11px] font-semibold text-foreground">SFU 로그</div>
                <div className="space-y-1 text-[10px] leading-tight text-muted">
                  {sfuLogs.length === 0 ? <div>이벤트 없음</div> : sfuLogs.map((line, idx) => <div key={`${line}-${idx}`}>{line}</div>)}
                </div>
              </div>
            </div>
          )}
          {pendingHostAction && (
            <div className="fixed inset-0 z-30 grid place-items-center bg-black/35 px-4">
              <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-4 shadow-xl">
                <h4 className="text-sm font-semibold text-foreground">
                  {pendingHostAction.type === 'kick' ? '참가자 내보내기' : '강제 음소거'}
                </h4>
                <p className="mt-2 text-sm text-muted">
                  <span className="font-semibold text-foreground">{pendingHostAction.name}</span>
                  {pendingHostAction.type === 'kick'
                    ? ' 님을 통화에서 내보낼까요?'
                    : ' 님을 음소거할까요?'}
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-subtle/40"
                    onClick={() => setPendingHostAction(null)}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg px-3 py-1.5 text-sm text-white ${pendingHostAction.type === 'kick' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600'}`}
                    onClick={() => {
                      if (pendingHostAction.type === 'kick') {
                        hostKick(pendingHostAction.targetUserId);
                      } else {
                        hostForceMute(pendingHostAction.targetUserId);
                      }
                      setPendingHostAction(null);
                    }}
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 border-b border-border bg-subtle/20 flex items-center justify-between">
      <div className="text-sm flex items-center gap-3">
        <span className="font-semibold">{h.mode === 'video' ? '화상 채널' : '음성 채널'}</span>
        <span className="text-muted text-xs">#{channelId} · {mm}:{ss}</span>
        <div className="flex items-center gap-1">
          {Array.from(new Set([me.id, ...(h.members || []), ...Object.keys(remoteVisualStreams)])).map((memberId, i) => {
            const user = users[memberId];
            const displayName = user?.name ?? memberId;
            return <Avatar key={`${memberId}-${i}`} name={displayName} avatarUrl={user?.avatarUrl} />;
          })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <video ref={localVideoRef} autoPlay muted playsInline className="hidden h-10 w-16 rounded border border-border bg-black object-cover md:block" />
        {Object.entries(remoteVisualStreams)
          .flatMap(([userId, streams]) => [streams.screen, streams.video].filter(Boolean).map((stream) => ({ userId, stream: stream as MediaStream })))
          .slice(0, 2)
          .map(({ userId, stream }) => (
            <video
              key={`${userId}-${stream.id}`}
              autoPlay
              playsInline
              className="hidden h-10 w-16 rounded border border-border bg-black object-cover md:block"
              ref={(el) => {
                if (el) el.srcObject = stream;
              }}
            />
          ))}
        <button
          className="px-2 py-1 text-xs rounded border border-border hover:bg-subtle/60 inline-flex items-center gap-1"
          onClick={toggleCamera}
          title={cameraOn ? '카메라 끄기' : '카메라 켜기'}
        >
          {cameraOn ? <Camera size={14} /> : <CameraOff size={14} />}
          {cameraOn ? 'Cam On' : 'Cam Off'}
        </button>
        <button
          className="px-2 py-1 text-xs rounded border border-border hover:bg-subtle/60 inline-flex items-center gap-1"
          onClick={handleToggleMute}
          title={h.muted ? 'Unmute' : 'Mute'}
        >
          {h.muted ? <MicOff size={14} /> : <Mic size={14} />}
          {h.muted ? 'Unmute' : 'Mute'}
        </button>
        <button
          className="px-2 py-1 text-xs rounded border border-border hover:bg-rose-500/10 inline-flex items-center gap-1"
          onClick={handleDisconnectCall}
          title="Leave"
        >
          <PhoneOff size={14} /> Leave
        </button>
      </div>
    </div>
  );
}
