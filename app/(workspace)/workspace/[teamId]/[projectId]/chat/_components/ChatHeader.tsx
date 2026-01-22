'use client';

import type { ChangeEvent } from 'react';
import {
  Bookmark,
  Command,
  Hash,
  MessageSquare,
  Pin,
  PlusCircle,
  Settings2,
  Users,
  UserPlus2,
  Info,
  ChevronDown,
} from 'lucide-react';

import type { ViewMode } from "@/workspace/chat/_model/types";

type DMOption = { id: string; name: string };

type ChatHeaderProps = {
  isDM: boolean;
  channelName: string;
  memberCount: number;
  topic?: string;
  view: ViewMode;
  onToggleView: () => void;
  onOpenInvite: () => void;
  onOpenSettings: () => void;
  onOpenCmd: () => void;
  onOpenCreateChannel: () => void;
  onOpenPins: () => void;
  onOpenSaved: () => void;
  dmOptions: DMOption[];
  pinCount?: number;
  savedCount?: number;
  onSelectDM: (id: string) => void;
};

const headerButtonClass =
  'inline-flex items-center gap-1 rounded-md border border-border/60 bg-subtle/30 px-2 py-1 text-xs font-medium transition-colors duration-150 ease-out hover:border-border hover:bg-subtle/50';

const ghostActionClass =
  'inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors duration-150 ease-out hover:text-text';

export function ChatHeader({
  isDM,
  channelName,
  memberCount,
  topic,
  view,
  onToggleView,
  onOpenInvite,
  onOpenSettings,
  onOpenCmd,
  onOpenCreateChannel,
  onOpenPins,
  onOpenSaved,
  dmOptions,
  pinCount = 0,
  savedCount = 0,
  onSelectDM,
}: ChatHeaderProps) {
  const pad = view === 'compact' ? 'py-3' : 'py-4';

  const handleSelectDM = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;
    onSelectDM(value);
    e.target.value = '';
  };

  return (
    <div className={`px-4 border-b border-border ${pad}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 text-lg font-semibold leading-none">
              {isDM ? <MessageSquare size={18} className="text-muted" /> : <Hash size={18} className="text-muted" />}
              <span className="truncate max-w-[240px] sm:max-w-[320px] md:max-w-[380px]">{channelName}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Users size={14} className="opacity-70" />
              {memberCount > 0 ? `${memberCount}명` : '멤버 없음'}
            </span>
            {!isDM && (
              <button className={`${headerButtonClass} hidden sm:inline-flex`} onClick={onOpenInvite} title='채널에 멤버 초대'>
                <UserPlus2 size={14} /> Invite
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            {!isDM && topic && (
              <span className="inline-flex items-center gap-1 truncate max-w-[320px] md:max-w-[420px]">
                <Info size={13} className="opacity-70" />
                {topic}
              </span>
            )}
            {!isDM && (
              <button className={ghostActionClass} onClick={onOpenSettings}>
                {topic ? '주제 수정' : '주제 추가'}
              </button>
            )}
            <button className={ghostActionClass} onClick={onOpenCmd}>
              <Command size={12} /> Quick Switch
            </button>
            {!isDM && (
              <button className={ghostActionClass} onClick={onOpenCreateChannel}>
                <PlusCircle size={12} /> 새 채널
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs md:justify-end">
          <div className="relative inline-flex items-center">
            <select
              className="appearance-none bg-subtle/30 border border-border/60 px-3 py-1 pr-8 rounded-md transition-colors duration-150 ease-out hover:border-border focus:border-brand focus:outline-none"
              onChange={handleSelectDM}
              defaultValue=""
              title='DM 바로가기'
            >
              <option value="" disabled>
                DM 바로가기
              </option>
              {dmOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2 text-muted" />
          </div>
          <button className={headerButtonClass} onClick={onOpenPins} title='채널 핀 보기'>
            <Pin size={14} />
            Pins
            {pinCount > 0 && <span className="ml-1 text-[10px] opacity-70">{pinCount}</span>}
          </button>
          <button className={headerButtonClass} onClick={onOpenSaved} title='저장한 메시지 보기'>
            <Bookmark size={14} />
            Saved
            {savedCount > 0 && <span className="ml-1 text-[10px] opacity-70">{savedCount}</span>}
          </button>
          <button className={headerButtonClass} onClick={onToggleView} title='뷰 모드 전환'>
            <Settings2 size={14} />
            {view === 'cozy' ? 'Cozy' : 'Compact'}
          </button>
        </div>
      </div>
    </div>
  );
}
