// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/MessageContextMenu.tsx
'use client';

import React from 'react';
import {
  MessageSquare, SmilePlus, Pencil, Trash2,
  Pin, PinOff, Megaphone, EyeOff, Bookmark, BookmarkX, Reply
} from 'lucide-react';
import EmojiPicker from "./EmojiPicker";

type Item =
  | { id: 'reply';   label: string; icon: React.ReactNode }
  | { id: 'react';   label: string; icon: React.ReactNode }
  | { id: 'quote';   label: string; icon: React.ReactNode }
  | { id: 'pin';     label: string; icon: React.ReactNode }
  | { id: 'unpin';   label: string; icon: React.ReactNode }
  | { id: 'unread';  label: string; icon: React.ReactNode }
  | { id: 'save';    label: string; icon: React.ReactNode }
  | { id: 'unsave';  label: string; icon: React.ReactNode }
  | { id: 'edit';    label: string; icon: React.ReactNode }
  | { id: 'delete';  label: string; icon: React.ReactNode }
  | { id: 'huddle';  label: string; icon: React.ReactNode };

export default function MessageContextMenu({
  open, x, y, canEdit, pinned, saved, onAction, onClose
}: {
  open: boolean;
  x: number; y: number;
  canEdit: boolean;
  pinned: boolean;
  saved: boolean;
  onAction: (id: Item['id'], payload?: { emoji?: string }) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const items: Item[] = [
    { id: 'reply',  label: '스레드 답장',  icon: <MessageSquare size={14}/> },
    { id: 'react',  label: '반응 추가',     icon: <SmilePlus size={14}/> },
    { id: 'quote',  label: '답장',          icon: <Reply size={14}/> },
    pinned ? { id: 'unpin', label: '메시지 고정 해제', icon: <PinOff size={14}/> } : { id: 'pin', label: '메시지 고정', icon: <Pin size={14}/> },
    { id: 'unread', label: '여기부터 읽지 않음', icon: <EyeOff size={14}/> },
    saved ? { id: 'unsave', label: '저장 해제', icon: <BookmarkX size={14}/> } : { id: 'save', label: '메시지 저장', icon: <Bookmark size={14}/> },
    ...(canEdit ? [{ id: 'edit', label: '메시지 수정', icon: <Pencil size={14}/> } as Item] : []),
    ...(canEdit ? [{ id: 'delete', label: '메시지 삭제', icon: <Trash2 size={14}/> } as Item] : []),
    { id: 'huddle', label: '여기서 허들 시작', icon: <Megaphone size={14}/> },
  ];

  return (
    <div className="fixed inset-0 z-[120]" onClick={onClose} onContextMenu={(e)=>{e.preventDefault(); onClose();}}>
      <div className="absolute inset-0" />
      <div
        className="absolute z-[121] w-60 rounded-lg border border-border bg-panel shadow-xl p-1"
        style={{ left: Math.min(x, window.innerWidth - 240), top: Math.min(y, window.innerHeight - 380) }}
        onClick={(e)=> e.stopPropagation()}
      >
        {items.map((it) =>
          it.id === "react" ? (
            <div key={it.id} className="relative">
              <EmojiPicker
                onPick={(emoji) => onAction("react", { emoji })}
                panelSide="right"
                anchorClass="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-subtle/60"
                triggerContent={
                  <>
                    {it.icon}
                    {it.label}
                  </>
                }
              />
            </div>
          ) : (
            <button
              key={it.id}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-subtle/60 ${it.id === 'delete' ? 'text-rose-500' : ''}`}
              onClick={() => onAction(it.id)}
            >
              {it.icon}
              {it.label}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
