// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/EmojiPicker.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Clock3,
  Smile,
  UserRound,
  PawPrint,
  UtensilsCrossed,
  Plane,
  Dumbbell,
  Laptop,
  AtSign,
  Flag,
} from 'lucide-react';
import { imogiShortcuts } from "@/workspace/chat/_model/emoji.shortcuts";
const RECENT_EMOJI_KEY = "fd.chat.recentEmojis";
type EmojiCategoryKey = keyof typeof imogiShortcuts;
type EmojiTabKey = "recent" | EmojiCategoryKey;

export default function EmojiPicker({
  onPick,
  anchorClass = "px-1.5 py-0.5 text-[11px] rounded border border-border hover:bg-subtle/60",
  triggerContent,
  panelSide = "top",
  panelAlign = "left",
  panelOffsetX = 0,
  presentation = "popover",
}: {
  onPick: (emoji: string)=> void;
  anchorClass?: string;
  triggerContent?: React.ReactNode;
  panelSide?: "top" | "bottom" | "right";
  panelAlign?: "left" | "right";
  panelOffsetX?: number;
  presentation?: "popover" | "modal";
}) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<EmojiTabKey>("recent");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  const categoryMeta: Array<{ key: EmojiTabKey; label: string; icon: React.ReactNode }> = [
    { key: "recent", label: "최근", icon: <Clock3 size={17} /> },
    { key: "Emotion", label: "감정", icon: <Smile size={17} /> },
    { key: "PeopleBodyRoles", label: "사람", icon: <UserRound size={17} /> },
    { key: "AnimalsAndNature", label: "동물/자연", icon: <PawPrint size={17} /> },
    { key: "FoodAndDrink", label: "음식", icon: <UtensilsCrossed size={17} /> },
    { key: "TravelAndPlaces", label: "여행", icon: <Plane size={17} /> },
    { key: "ActivitiesAndSports", label: "활동", icon: <Dumbbell size={17} /> },
    { key: "ObjectsAndTechnology", label: "사물", icon: <Laptop size={17} /> },
    { key: "SymbolsAndSigns", label: "기호", icon: <AtSign size={17} /> },
    { key: "Flags", label: "국기", icon: <Flag size={17} /> },
  ];

  const allEntries = useMemo(
    () =>
      categoryMeta
        .filter((meta): meta is { key: EmojiCategoryKey; label: string; icon: React.ReactNode } => meta.key !== "recent")
        .flatMap((meta) =>
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
      if (category === "recent") {
        return recentEmojis.map((emoji) => ({
          category: "recent" as const,
          emoji,
          shortcut: "",
        }));
      }
      return Object.entries(imogiShortcuts[category]).map(([emoji, shortcut]) => ({
        category: category as EmojiCategoryKey,
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
  }, [allEntries, category, q, recentEmojis]);

  const sideBase =
    panelSide === "bottom"
      ? "top-full mt-1"
      : panelSide === "right"
        ? "left-full top-0 ml-1"
        : "bottom-full mb-1";
  const alignClass =
    panelSide === "right" ? "" : panelAlign === "right" ? "right-0" : "left-0";
  const panelPositionClass = `${sideBase} ${alignClass}`.trim();
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(RECENT_EMOJI_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setRecentEmojis(parsed.filter((v) => typeof v === "string").slice(0, 12));
        if (parsed.length > 0) setCategory("recent");
      }
    } catch {
      // ignore malformed cache
    }
  }, []);
  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);
  const saveRecent = (emoji: string) => {
    setRecentEmojis((prev) => {
      const next = [emoji, ...prev.filter((item) => item !== emoji)].slice(0, 12);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(RECENT_EMOJI_KEY, JSON.stringify(next));
      }
      return next;
    });
  };
  const pickerBody = (
    <>
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
                saveRecent(first.emoji);
                setOpen(false);
                setModalOpen(false);
              }
            }
          }}
        />
      </div>
      <div className="flex gap-3">
        <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-border pr-2">
          {categoryMeta.map((meta) => (
            <button
              key={meta.key}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${
                category === meta.key ? "bg-brand text-white" : "text-muted hover:bg-subtle/70"
              }`}
              onClick={() => setCategory(meta.key)}
              title={meta.label}
              type="button"
            >
              {meta.icon}
            </button>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          {category === "recent" && recentEmojis.length === 0 && !q.trim() ? (
            <div className="py-8 text-center text-xs text-muted">최근 사용한 이모지가 없습니다.</div>
          ) : (
            <div className="max-h-[22rem] overflow-y-auto">
              <div className="grid grid-cols-8 -gap-10">
          {list.map(({ emoji, shortcut }, i) => (
            <button
              key={`${emoji}-${i}`}
              className="flex h-12 items-center justify-center rounded-none text-[30px] leading-none transition-colors hover:bg-brand/20"
              onClick={() => {
                onPick(emoji);
                saveRecent(emoji);
                setOpen(false);
                setModalOpen(false);
              }}
              type="button"
              aria-label={shortcut}
            >
              <span className="leading-none">{emoji}</span>
            </button>
          ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (presentation === "modal") {
    return (
      <>
        <button
          type="button"
          className={anchorClass}
          onClick={() => setModalOpen(true)}
        >
          {triggerContent ?? (<><span className="mr-1">😊</span>추가</>)}
        </button>
        {modalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 px-4" onClick={() => setModalOpen(false)}>
            <div className="w-full max-w-2xl rounded-2xl border border-border bg-panel p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              {pickerBody}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <details open={open} onToggle={(e)=> setOpen((e.target as HTMLDetailsElement).open)} className="relative">
      <summary className={`list-none cursor-pointer inline-flex items-center ${anchorClass}`}>
        {triggerContent ?? (<><span className="mr-1">😊</span>추가</>)}
      </summary>
      <div
        className={`absolute ${panelPositionClass} w-80 rounded-md border border-border bg-panel shadow-panel p-2 z-20`}
        style={panelOffsetX ? { transform: `translateX(${panelOffsetX}px)` } : undefined}
      >
        {pickerBody}
      </div>
    </details>
  );
}
