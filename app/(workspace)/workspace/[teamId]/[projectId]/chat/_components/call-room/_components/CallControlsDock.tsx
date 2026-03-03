// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/call-room/_components/CallControlsDock.tsx
'use client';

import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Users,
  Video,
  VideoOff,
  VolumeX,
} from "lucide-react";

type CallControlsDockProps = {
  controlsCollapsed: boolean;
  muted: boolean;
  isDeafened: boolean;
  cameraOn: boolean;
  isScreenSharing: boolean;
  muteDisabled: boolean;
  cameraDisabled: boolean;
  screenShareDisabled: boolean;
  chatPanelActive: boolean;
  participantsPanelActive: boolean;
  chatCount: number;
  participantCount: number;
  micVolume: number;
  speakerVolume: number;
  onToggleCollapsed: () => void;
  onToggleMute: () => void;
  onToggleDeafened: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onDisconnect: () => void;
  onToggleChatPanel: () => void;
  onToggleParticipantsPanel: () => void;
  onMicVolumeChange: (value: number) => void;
  onSpeakerVolumeChange: (value: number) => void;
};

export function CallControlsDock({
  controlsCollapsed,
  muted,
  isDeafened,
  cameraOn,
  isScreenSharing,
  muteDisabled,
  cameraDisabled,
  screenShareDisabled,
  chatPanelActive,
  participantsPanelActive,
  chatCount,
  participantCount,
  micVolume,
  speakerVolume,
  onToggleCollapsed,
  onToggleMute,
  onToggleDeafened,
  onToggleCamera,
  onToggleScreenShare,
  onDisconnect,
  onToggleChatPanel,
  onToggleParticipantsPanel,
  onMicVolumeChange,
  onSpeakerVolumeChange,
}: CallControlsDockProps) {
  const iconBtnBase =
    "inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-all duration-200 hover:scale-[1.04] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";
  const displayedMicVolume = muted ? 0 : micVolume;
  const displayedSpeakerVolume = isDeafened ? 0 : speakerVolume;

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-20 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-border bg-gradient-to-b from-background to-panel px-2 py-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.38)]">
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-subtle/70 text-foreground transition-colors hover:bg-subtle"
          onClick={onToggleCollapsed}
          title={controlsCollapsed ? "컨트롤 펼치기" : "컨트롤 접기"}
        >
          {controlsCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        {!controlsCollapsed && (
          <>
            <div className="group relative">
              <button
                className={`${iconBtnBase} ${muted ? "bg-rose-500 shadow-[0_6px_18px_rgba(244,63,94,0.45)]" : "bg-emerald-500 shadow-[0_6px_18px_rgba(16,185,129,0.45)]"}`}
                onClick={onToggleMute}
                disabled={muteDisabled}
                title={muted ? "음소거 해제" : "음소거"}
              >
                {muted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <div className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 w-[250px] -translate-x-1/2 translate-y-1 rounded-[22px] border border-white/20 bg-[#3b3d41]/95 px-4 py-3 opacity-0 shadow-[0_14px_30px_rgba(0,0,0,0.46)] backdrop-blur-md transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="flex items-center gap-2.5">
                  <Mic size={20} className="text-white" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={displayedMicVolume}
                    onChange={(e) => onMicVolumeChange(Number(e.target.value))}
                    disabled={muted}
                    className="h-1.5 w-full cursor-pointer accent-white disabled:opacity-60"
                  />
                  <MicOff size={20} className="text-white/80" />
                </div>
              </div>
            </div>
            <div className="group relative">
              <button
                className={`${iconBtnBase} ${isDeafened ? "bg-rose-500 shadow-[0_6px_18px_rgba(244,63,94,0.45)]" : "bg-blue-500 shadow-[0_6px_18px_rgba(59,130,246,0.45)]"}`}
                onClick={onToggleDeafened}
                title={isDeafened ? "출력 음소거 해제" : "출력 음소거"}
              >
                {isDeafened ? <VolumeX size={16} /> : <Headphones size={16} />}
              </button>
              <div className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 w-[250px] -translate-x-1/2 translate-y-1 rounded-[22px] border border-white/20 bg-[#3b3d41]/95 px-4 py-3 opacity-0 shadow-[0_14px_30px_rgba(0,0,0,0.46)] backdrop-blur-md transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="flex items-center gap-2.5">
                  <Headphones size={20} className="text-white" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={displayedSpeakerVolume}
                    onChange={(e) => onSpeakerVolumeChange(Number(e.target.value))}
                    disabled={isDeafened}
                    className="h-1.5 w-full cursor-pointer accent-white disabled:opacity-60"
                  />
                  <VolumeX size={20} className="text-white/80" />
                </div>
              </div>
            </div>
            <button
              className={`${iconBtnBase} ${cameraOn ? "bg-brand shadow-[0_6px_18px_rgba(59,130,246,0.4)]" : "bg-rose-500 shadow-[0_6px_18px_rgba(244,63,94,0.45)]"}`}
              onClick={onToggleCamera}
              disabled={cameraDisabled}
              title={cameraOn ? "비디오 끄기" : "비디오 켜기"}
            >
              {cameraOn ? <Video size={16} /> : <VideoOff size={16} />}
            </button>
            <button
              className={`${iconBtnBase} ${isScreenSharing ? "bg-rose-500 shadow-[0_6px_18px_rgba(244,63,94,0.45)]" : "bg-indigo-600 shadow-[0_6px_18px_rgba(79,70,229,0.45)] hover:bg-indigo-500"}`}
              onClick={onToggleScreenShare}
              disabled={screenShareDisabled}
              title={isScreenSharing ? "화면 공유 중지" : "화면 공유"}
            >
              <Monitor size={16} />
            </button>
            <button
              className={`${iconBtnBase} bg-rose-600 shadow-[0_8px_20px_rgba(225,29,72,0.5)] hover:bg-rose-500`}
              onClick={onDisconnect}
              title="연결 끊기"
            >
              <PhoneOff size={16} />
            </button>
            <button
              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent transition-all duration-200 hover:scale-[1.04] active:scale-95 ${
                chatPanelActive
                  ? "bg-brand text-white shadow-[0_6px_18px_rgba(59,130,246,0.45)]"
                  : "border-border/70 bg-subtle/70 text-foreground hover:bg-subtle"
              }`}
              data-call-panel-toggle="true"
              onClick={onToggleChatPanel}
              title="채팅"
            >
              <MessageSquare size={16} />
              {chatCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-rose-500 px-1 text-center text-[10px] font-semibold text-white">
                  {chatCount > 99 ? "99+" : chatCount}
                </span>
              )}
            </button>
            <button
              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent transition-all duration-200 hover:scale-[1.04] active:scale-95 ${
                participantsPanelActive
                  ? "bg-brand text-white shadow-[0_6px_18px_rgba(59,130,246,0.45)]"
                  : "border-border/70 bg-subtle/70 text-foreground hover:bg-subtle"
              }`}
              data-call-panel-toggle="true"
              onClick={onToggleParticipantsPanel}
              title="참여자"
            >
              <Users size={16} />
              <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-blue-600 px-1 text-center text-[10px] font-semibold text-white">
                {participantCount > 99 ? "99+" : participantCount}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
