// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/call-room/_components/CallStage.tsx
'use client';

import type { MouseEvent } from "react";
import { Headphones, Mic, MicOff, Monitor, Video } from "lucide-react";

export type CallVisualTile = {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  stream: MediaStream;
  source: "camera" | "screen";
  isMe: boolean;
};

type AudioParticipant = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isMe: boolean;
  stream?: MediaStream | null;
};

type CallStageProps = {
  gridMode: boolean;
  visualTiles: CallVisualTile[];
  audioParticipants: AudioParticipant[];
  focusTileId: string | null;
  mediaStateByUser: Record<string, { audio: boolean; video: boolean; screen: boolean }>;
  listenerStateByUser: Record<string, boolean>;
  speakingByUser: Record<string, boolean>;
  videoPage: number;
  speakerVolume: number;
  onVideoPageChange: (page: number) => void;
  onFocusTile: (tileId: string) => void;
};

const SIDE_PAGE_SIZE = 4;

export function CallStage({
  gridMode,
  visualTiles,
  audioParticipants,
  focusTileId,
  mediaStateByUser,
  listenerStateByUser,
  speakingByUser,
  videoPage,
  speakerVolume,
  onVideoPageChange,
  onFocusTile,
}: CallStageProps) {
  const requestVideoFullscreen = (event: MouseEvent<HTMLVideoElement>) => {
    const target = event.currentTarget as HTMLVideoElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };
    if (target.requestFullscreen) {
      void target.requestFullscreen();
      return;
    }
    if (target.webkitRequestFullscreen) {
      void target.webkitRequestFullscreen();
      return;
    }
    if (target.msRequestFullscreen) {
      void target.msRequestFullscreen();
    }
  };

  const tileById = new Map(visualTiles.map((tile) => [tile.id, tile]));
  const cameraTileByUser = new Map(visualTiles.filter((tile) => tile.source === "camera").map((tile) => [tile.userId, tile]));
  const screenTileByUser = new Map(visualTiles.filter((tile) => tile.source === "screen").map((tile) => [tile.userId, tile]));

  const selectedUserId = focusTileId?.startsWith("user:") ? focusTileId.slice(5) : null;
  const selectedTile = focusTileId && !focusTileId.startsWith("user:") ? tileById.get(focusTileId) : null;

  const mainParticipant =
    audioParticipants.find((participant) => participant.id === selectedUserId) ??
    (selectedTile ? audioParticipants.find((participant) => participant.id === selectedTile.userId) : undefined) ??
    audioParticipants[0];

  const mainVisual =
    selectedTile ??
    (selectedUserId ? screenTileByUser.get(selectedUserId) ?? cameraTileByUser.get(selectedUserId) ?? null : null) ??
    (mainParticipant ? screenTileByUser.get(mainParticipant.id) ?? cameraTileByUser.get(mainParticipant.id) ?? null : null) ??
    visualTiles.find((tile) => tile.source === "screen") ??
    null;

  const secondaryMainVisual =
    mainParticipant && mainVisual
      ? screenTileByUser.get(mainParticipant.id)?.id !== mainVisual.id
        ? (screenTileByUser.get(mainParticipant.id) ?? null)
        : cameraTileByUser.get(mainParticipant.id)?.id !== mainVisual.id
          ? (cameraTileByUser.get(mainParticipant.id) ?? null)
          : null
      : null;

  const renderAvatar = (participant: AudioParticipant | { displayName: string; avatarUrl?: string }, size: "lg" | "md") => (
    <div className={`overflow-hidden rounded-full border border-border/70 bg-subtle/30 ${size === "lg" ? "h-48 w-48" : "h-20 w-20"}`}>
      {participant.avatarUrl ? (
        <img src={participant.avatarUrl} alt={participant.displayName} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-white">
          {participant.displayName.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );

  const renderStatusBadges = (userId: string) => {
    const muted = !(mediaStateByUser[userId]?.audio ?? true);
    const deafened = !!listenerStateByUser[userId];
    const speaking = !!speakingByUser[userId] && !muted;
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted">
        <span className={`inline-flex items-center ${speaking ? "text-emerald-400 animate-pulse" : muted ? "text-rose-400" : "text-muted"}`}>
          {muted ? <MicOff size={12} /> : <Mic size={12} />}
        </span>
        <span className={`inline-flex items-center ${deafened ? "text-rose-400" : "text-muted"}`}>
          <Headphones size={12} />
        </span>
      </span>
    );
  };

  const renderVisualCard = (tile: CallVisualTile, mode: "main" | "side" | "grid") => {
    const small = mode !== "main";
    return (
      <div className={`relative h-full w-full overflow-hidden rounded-xl border border-border/70 bg-black ${mode === "main" ? "min-h-[400px]" : ""}`}>
        <video
          autoPlay
          playsInline
          muted={tile.isMe}
          className="h-full w-full object-cover"
          onDoubleClick={requestVideoFullscreen}
          title="더블클릭으로 전체화면"
          ref={(el) => {
            if (!el) return;
            if (el.srcObject !== tile.stream) el.srcObject = tile.stream;
            el.volume = tile.isMe ? 0 : speakerVolume;
          }}
        />
        <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
          {tile.source === "screen" ? <Monitor size={10} /> : <Video size={10} />}
          <span>{tile.source === "screen" ? "공유" : "캠"}</span>
        </div>
        <div className="absolute bottom-2 left-2 right-2 rounded-md bg-black/50 px-2 py-1 text-xs text-white">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">{tile.displayName}{tile.isMe ? " (나)" : ""}</span>
            {renderStatusBadges(tile.userId)}
          </div>
          {small && <div className="mt-0.5 text-[10px] text-muted/90">클릭 시 메인 전환</div>}
        </div>
      </div>
    );
  };

  const renderAudioCard = (participant: AudioParticipant, mode: "main" | "side" | "grid") => {
    const large = mode === "main";
    return (
      <div className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-black ${large ? "min-h-[400px]" : ""}`}>
        <div className="flex flex-col items-center gap-4">
          {renderAvatar(participant, large ? "lg" : "md")}
          <div className="rounded-md bg-black/50 px-3 py-1 text-sm text-white">
            <div className="flex items-center gap-2">
              <span>{participant.displayName}{participant.isMe ? " (나)" : ""}</span>
              {renderStatusBadges(participant.id)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const focusParticipant = (participant: AudioParticipant) => {
    const tile = screenTileByUser.get(participant.id) ?? cameraTileByUser.get(participant.id) ?? null;
    onVideoPageChange(1);
    onFocusTile(tile ? tile.id : `user:${participant.id}`);
  };

  if (gridMode) {
    const rows: AudioParticipant[][] = [];
    for (let i = 0; i < audioParticipants.length; i += 3) rows.push(audioParticipants.slice(i, i + 3));
    return (
      <div className="h-full min-h-0 overflow-y-auto p-3">
        <div className="space-y-3">
          {rows.map((row, rowIndex) => {
            const isLast = rowIndex === rows.length - 1;
            const isIncomplete = isLast && row.length < 3;
            return (
              <div key={`row-${rowIndex}`} className={`grid gap-3 ${isIncomplete ? "grid-cols-3" : "grid-cols-3"}`}>
                {isIncomplete && row.length === 1 && <div />}
                {row.map((participant) => {
                  const tile = screenTileByUser.get(participant.id) ?? cameraTileByUser.get(participant.id) ?? null;
                  return (
                    <button key={participant.id} type="button" className="block h-[280px] text-left" onClick={() => focusParticipant(participant)}>
                      {tile ? renderVisualCard(tile, "grid") : renderAudioCard(participant, "grid")}
                    </button>
                  );
                })}
                {isIncomplete && row.length === 1 && <div />}
                {isIncomplete && row.length === 2 && <div />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const sideParticipants = audioParticipants.filter((participant) => participant.id !== mainParticipant?.id);
  const totalPages = Math.max(1, Math.ceil(sideParticipants.length / SIDE_PAGE_SIZE));
  const currentPage = Math.min(videoPage, totalPages);
  const currentSideParticipants = sideParticipants.slice((currentPage - 1) * SIDE_PAGE_SIZE, currentPage * SIDE_PAGE_SIZE);
  const sideSlots = [...currentSideParticipants, ...Array.from({ length: Math.max(0, SIDE_PAGE_SIZE - currentSideParticipants.length) }, () => null)];

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 p-2 xl:grid-cols-[3fr_1fr]">
      <div className="min-h-0">
        {mainParticipant ? (
          <div className="relative h-full">
            {mainVisual ? renderVisualCard(mainVisual, "main") : renderAudioCard(mainParticipant, "main")}
            {secondaryMainVisual && (
              <button
                type="button"
                className="absolute right-3 top-3 h-[180px] w-[300px] max-w-[40%] min-w-[180px] text-left"
                onClick={() => {
                  onVideoPageChange(1);
                  onFocusTile(secondaryMainVisual.id);
                }}
              >
                {renderVisualCard(secondaryMainVisual, "side")}
              </button>
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-border/70 bg-black text-sm text-muted">
            참가자가 없습니다.
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-col rounded-xl border border-border/70 bg-panel/45 p-2">
        <div className="mb-2 text-xs font-semibold text-muted">참여자</div>
        <div
          className="grid flex-1 gap-2 overflow-y-auto"
          style={{ gridTemplateRows: `repeat(${SIDE_PAGE_SIZE}, minmax(0, 1fr))` }}
        >
          {sideSlots.map((participant, index) => {
            if (!participant) {
              return <div key={`side-empty-${index}`} aria-hidden className="h-full w-full" />;
            }
            const tile = screenTileByUser.get(participant.id) ?? cameraTileByUser.get(participant.id) ?? null;
            return (
              <button key={participant.id} type="button" className="block h-full w-full text-left" onClick={() => focusParticipant(participant)}>
                {tile ? renderVisualCard(tile, "side") : renderAudioCard(participant, "side")}
              </button>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="mt-2 flex items-center justify-center gap-2.5 border-t border-border pt-2">
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-subtle/70 hover:bg-subtle"
              onClick={() => onVideoPageChange(Math.max(1, currentPage - 1))}
            >
              ◀
            </button>
            <span className="text-sm font-semibold">{currentPage} / {totalPages}</span>
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-subtle/70 hover:bg-subtle"
              onClick={() => onVideoPageChange(Math.min(totalPages, currentPage + 1))}
            >
              ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
