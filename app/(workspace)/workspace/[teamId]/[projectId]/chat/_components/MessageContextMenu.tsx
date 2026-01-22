// components/chat/MessageContextMenu.tsx
'use client';

import React from 'react';
import {
  MessageSquare, SmilePlus, Copy, Link as LinkIcon, Pencil, Trash2,
  Pin, PinOff, Megaphone, EyeOff, Bookmark, BookmarkX, CornerDownRight
} from 'lucide-react';

type Item =
  | { id: 'reply';   label: string; icon: React.ReactNode }
  | { id: 'react';   label: string; icon: React.ReactNode }
  | { id: 'copy';    label: string; icon: React.ReactNode }
  | { id: 'quote';   label: string; icon: React.ReactNode }
  | { id: 'link';    label: string; icon: React.ReactNode }
  | { id: 'pin';     label: string; icon: React.ReactNode }
  | { id: 'unpin';   label: string; icon: React.ReactNode }
  | { id: 'unread';  label: string; icon: React.ReactNode }
  | { id: 'save';    label: string; icon: React.ReactNode }
  | { id: 'unsave';  label: string; icon: React.ReactNode }
  | { id: 'open-thread'; label: string; icon: React.ReactNode }
  | { id: 'edit';    label: string; icon: React.ReactNode; disabled?: boolean }
  | { id: 'delete';  label: string; icon: React.ReactNode; disabled?: boolean }
  | { id: 'huddle';  label: string; icon: React.ReactNode };

export default function MessageContextMenu({
  open, x, y, canEdit, pinned, saved, onAction, onClose
}: {
  open: boolean;
  x: number; y: number;
  canEdit: boolean;
  pinned: boolean;
  saved: boolean;
  onAction: (id: Item['id']) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const items: Item[] = [
    { id: 'reply',  label: 'Reply in thread',  icon: <MessageSquare size={14}/> },
    { id: 'open-thread', label: 'Open in right panel', icon: <CornerDownRight size={14}/> },
    { id: 'react',  label: 'Add reaction',     icon: <SmilePlus size={14}/> },
    { id: 'copy',   label: 'Copy text',        icon: <Copy size={14}/> },
    { id: 'quote',  label: 'Copy as quote',    icon: <Copy size={14}/> },
    { id: 'link',   label: 'Copy message link',icon: <LinkIcon size={14}/> },
    pinned ? { id: 'unpin', label: 'Unpin message', icon: <PinOff size={14}/> } : { id: 'pin', label: 'Pin message', icon: <Pin size={14}/> },
    { id: 'unread', label: 'Mark unread from here', icon: <EyeOff size={14}/> },
    saved ? { id: 'unsave', label: 'Unsave message', icon: <BookmarkX size={14}/> } : { id: 'save', label: 'Save message', icon: <Bookmark size={14}/> },
    { id: 'edit',   label: 'Edit message',     icon: <Pencil size={14}/>, disabled: !canEdit },
    { id: 'delete', label: 'Delete message',   icon: <Trash2 size={14}/>, disabled: !canEdit },
    { id: 'huddle', label: 'Start huddle here', icon: <Megaphone size={14}/> },
  ];

  return (
    <div className="fixed inset-0 z-50" onClick={onClose} onContextMenu={(e)=>{e.preventDefault(); onClose();}}>
      <div className="absolute inset-0" />
      <div
        className="absolute z-50 w-56 rounded-md border border-border bg-panel shadow-panel p-1"
        style={{ left: Math.min(x, window.innerWidth - 240), top: Math.min(y, window.innerHeight - 380) }}
        onClick={(e)=> e.stopPropagation()}
      >
        {items.map(it => (
          <button
            key={it.id}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-subtle/60 ${'disabled' in it && it.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={('disabled' in it) ? !!it.disabled : false}
            onClick={()=> onAction(it.id)}
          >
            {it.icon}{it.label}
          </button>
        ))}
      </div>
    </div>
  );
}
