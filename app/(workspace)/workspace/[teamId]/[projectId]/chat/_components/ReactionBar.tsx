// components/chat/ReactionBar.tsx
'use client';

import React from "react";

const EMOJIS = ["👍","❤️","🎉","😂","👀","🔥","👏","😮"];

export default function ReactionBar({
  onPick
}: {
  onPick: (emoji: string) => void;
}) {
  return (
    <div className="rounded-full border border-border bg-panel px-2 py-1 shadow-panel flex items-center gap-1">
      {EMOJIS.map(e => (
        <button
          key={e}
          className="px-1.5 py-0.5 text-sm rounded hover:bg-subtle/60"
          onClick={()=> onPick(e)}
          title="Add reaction"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
