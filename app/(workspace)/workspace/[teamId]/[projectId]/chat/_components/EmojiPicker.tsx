// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/EmojiPicker.tsx
'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { imogiShortcuts } from "@/workspace/chat/_model/emoji.shortcuts";

export default function EmojiPicker({
  onPick,
  anchorClass = "px-1.5 py-0.5 text-[11px] rounded border border-border hover:bg-subtle/60",
  triggerContent,
  panelSide = "top",
}: {
  onPick: (emoji: string)=> void;
  anchorClass?: string;
  triggerContent?: React.ReactNode;
  panelSide?: "top" | "bottom" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<keyof typeof imogiShortcuts>("Emotion");

  const categoryMeta: Array<{ key: keyof typeof imogiShortcuts; label: string }> = [
    { key: "Emotion", label: "감정" },
    { key: "PeopleBodyRoles", label: "사람" },
    { key: "AnimalsAndNature", label: "동물/자연" },
    { key: "FoodAndDrink", label: "음식" },
    { key: "TravelAndPlaces", label: "여행" },
    { key: "ActivitiesAndSports", label: "활동" },
    { key: "ObjectsAndTechnology", label: "사물" },
    { key: "SymbolsAndSigns", label: "기호" },
    { key: "Flags", label: "국기" },
  ];

  const allEntries = useMemo(
    () =>
      categoryMeta.flatMap((meta) =>
        Object.entries(imogiShortcuts[meta.key]).map(([emoji, shortcut]) => ({
          category: meta.key,
          emoji,
          shortcut,
        })),
      ),
    [],
  );

  const list = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) {
      return Object.entries(imogiShortcuts[category]).map(([emoji, shortcut]) => ({
        category,
        emoji,
        shortcut,
      }));
    }
    const normalized = keyword.startsWith("/") ? keyword : `/${keyword}`;
    return allEntries.filter(({ emoji, shortcut }) =>
      emoji.includes(keyword) ||
      shortcut.toLowerCase().includes(keyword) ||
      shortcut.toLowerCase().includes(normalized),
    );
  }, [allEntries, category, q]);

  const panelPositionClass =
    panelSide === "bottom"
      ? "top-full left-0 mt-1"
      : panelSide === "right"
        ? "left-full top-0 ml-1"
        : "bottom-full left-0 mb-1";

  return (
    <details open={open} onToggle={(e)=> setOpen((e.target as HTMLDetailsElement).open)} className="relative">
      <summary className={`list-none cursor-pointer inline-flex items-center ${anchorClass}`}>
        {triggerContent ?? (<><span className="mr-1">😊</span>추가</>)}
      </summary>
      <div className={`absolute ${panelPositionClass} w-80 rounded-md border border-border bg-panel shadow-panel p-2 z-20`}>
        <div className="flex items-center gap-1 px-2 py-1 rounded border border-border bg-subtle/40 mb-2">
          <Search size={12} className="opacity-70" />
          <input
            autoFocus
            placeholder="이모지 또는 /기쁨 검색"
            className="flex-1 bg-transparent outline-none text-xs"
            value={q}
            onChange={(e)=> setQ(e.target.value)}
            onKeyDown={(e)=> {
              if (e.key === "Enter") {
                const first = list[0];
                if (first) {
                  onPick(first.emoji);
                  setOpen(false);
                }
              }
            }}
          />
        </div>
        <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
          {categoryMeta.map((meta) => (
            <button
              key={meta.key}
              className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${
                category === meta.key ? "bg-brand text-white" : "bg-subtle/40 text-muted hover:bg-subtle/70"
              }`}
              onClick={() => setCategory(meta.key)}
              type="button"
            >
              {meta.label}
            </button>
          ))}
        </div>
        <div className="max-h-56 overflow-y-auto">
          <div className="grid grid-cols-7 gap-1">
            {list.map(({ emoji, shortcut }, i) => (
              <button
                key={`${emoji}-${i}`}
                className="flex h-9 items-center justify-center rounded hover:bg-subtle/60 text-lg"
                onClick={() => {
                  onPick(emoji);
                  setOpen(false);
                }}
                title={`${emoji} ${shortcut}`}
                type="button"
              >
                <span className="leading-none">{emoji}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}
