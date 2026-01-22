// components/chat/EmojiPicker.tsx
'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

const DEFAULTS = ["👍","❤️","😂","🎉","😮","😢","🔥","🙏","👏","✅","❗","❓","😎","🤔","🥳","👀","💯","🌟","🧡","💡"];

export default function EmojiPicker({
  onPick,
  anchorClass = "px-1.5 py-0.5 text-[11px] rounded border border-border hover:bg-subtle/60",
  triggerContent
}: {
  onPick: (emoji: string)=> void;
  anchorClass?: string;
  triggerContent?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    if (!q.trim()) return DEFAULTS;
    return DEFAULTS.filter(e => e.includes(q.trim()));
  }, [q]);

  return (
    <details open={open} onToggle={(e)=> setOpen((e.target as HTMLDetailsElement).open)} className="relative">
      <summary className={`list-none cursor-pointer inline-flex items-center ${anchorClass}`}>
        {triggerContent ?? (<><span className="mr-1">😊</span>추가</>)}
      </summary>
      <div className="absolute top-full left-0 mt-1 w-56 rounded-md border border-border bg-panel shadow-panel p-2 z-10">
        <div className="flex items-center gap-1 px-2 py-1 rounded border border-border bg-subtle/40 mb-2">
          <Search size={12} className="opacity-70" />
          <input
            autoFocus
            placeholder="이모지 검색/붙여넣기"
            className="flex-1 bg-transparent outline-none text-xs"
            value={q}
            onChange={(e)=> setQ(e.target.value)}
            onKeyDown={(e)=> {
              if (e.key === "Enter") {
                const s = (e.currentTarget as HTMLInputElement).value.trim();
                if (s) onPick(s);
              }
            }}
          />
        </div>
        <div className="grid grid-cols-8 gap-1">
          {list.map((e,i)=> (
            <button
              key={i}
              className="h-8 rounded hover:bg-subtle/60 text-lg"
              onClick={()=> onPick(e)}
              title={e}
            >{e}</button>
          ))}
        </div>
      </div>
    </details>
  );
}
