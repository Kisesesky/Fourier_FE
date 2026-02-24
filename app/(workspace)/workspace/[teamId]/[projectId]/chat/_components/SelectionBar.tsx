// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/SelectionBar.tsx
'use client';

import { CheckSquare, Pin, Bookmark, Trash2, Laugh } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

type ChatSelectionBarProps = {
  count: number;
  onPin: () => void;
  onSave: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  onClear: () => void;
};

export function ChatSelectionBar({ count, onPin, onSave, onDelete, onReact, onClear }: ChatSelectionBarProps) {
  if (count === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-border bg-subtle/30 flex items-center gap-2 text-xs">
      <CheckSquare size={14} />
      <span>{count} selected</span>
      <div className="ml-2 flex items-center gap-1">
        <button className="px-2 py-0.5 rounded border border-border hover:bg-subtle/60" onClick={onPin}>
          <Pin size={12} /> Pin
        </button>
        <button className="px-2 py-0.5 rounded border border-border hover:bg-subtle/60" onClick={onSave}>
          <Bookmark size={12} /> Save
        </button>
        <button className="px-2 py-0.5 rounded border border-border hover:bg-subtle/60" onClick={onDelete}>
          <Trash2 size={12} /> Delete
        </button>
        <EmojiPicker
          onPick={onReact}
          presentation="modal"
          anchorClass="px-2 py-0.5 rounded border border-border hover:bg-subtle/60 inline-flex items-center gap-1 text-xs"
          triggerContent={
            <>
              <Laugh size={12} /> React
            </>
          }
        />
      </div>
      <button className="ml-auto px-2 py-0.5 rounded border border-border hover:bg-subtle/60" onClick={onClear}>
        취소
      </button>
    </div>
  );
}
