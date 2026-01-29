'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  FolderSearch,
  LayoutGrid,
  List,
  MessageCircleMore,
  Network,
  Server,
  Star,
  Users,
  ListTodo,
} from "lucide-react";

type StoredRecentItem = {
  id: string;
  title: string;
  description: string;
  tag: string;
  visitedAt: number;
  iconKey: string;
  path: string;
  iconValue?: string;
};

const STORAGE_KEY = "recently-visited";

const iconMap: Record<string, typeof Users> = {
  project: Server,
  docs: FolderSearch,
  chat: MessageCircleMore,
  calendar: CalendarDays,
  issues: Network,
  worksheet: List,
  members: Users,
};

const formatVisited = (ts: number) => {
  const diffMs = Date.now() - ts;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "방금 전 방문입니다";
  if (diffMinutes < 60) return `${diffMinutes}분 전 방문입니다`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전 방문입니다`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전 방문입니다`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}주 전 방문입니다`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}달 전 방문입니다`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}년 전 방문입니다`;
};

const RecentVisitedView = () => {
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [items, setItems] = useState<StoredRecentItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const load = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as StoredRecentItem[]) : [];
        setItems(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error("Failed to load recent visited", err);
        setItems([]);
      }
    };
    load();
    const handleUpdate = () => load();
    window.addEventListener("recently-visited:update", handleUpdate as EventListener);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("recently-visited:update", handleUpdate as EventListener);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const recentItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        icon: iconMap[item.iconKey] ?? Star,
        visited: formatVisited(item.visitedAt),
      })),
    [items]
  );

  const handleRemove = (id: string) => {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("recently-visited:update"));
    }
  };

  const handleClearAll = () => {
    setItems([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("recently-visited:update"));
    }
  };

  const CompactCard = ({
    item,
    size,
  }: {
    item: (typeof recentItems)[number];
    size: "grid" | "list";
  }) => {
    const Icon = item.icon;
    return (
      <article
        className={`group relative flex w-full items-center justify-between rounded-2xl border border-border bg-panel px-3 py-2 text-foreground shadow-[0_3px_12px_rgba(0,0,0,0.05)] transition hover:border-border/80 ${
          size === "grid" ? "h-[95px]" : "min-h-[42px]"
        }`}
        onClick={() => router.push(item.path)}
        role="button"
        tabIndex={0}
      >
        <button
          type="button"
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-rose-500/60 text-[14px] font-semibold text-rose-600 opacity-0 transition group-hover:opacity-100"
          onClick={(event) => {
            event.stopPropagation();
            handleRemove(item.id);
          }}
          aria-label="Remove recent"
        >
          –
        </button>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-accent text-muted">
            {item.iconValue ? (
              <img src={item.iconValue} alt={`${item.title} icon`} className="h-full w-full object-cover" />
            ) : (
              <Icon size={14} />
            )}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                {item.title.endsWith("'s Project") ? item.title : `${item.title}'s Project`}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-muted">
                <Icon size={11} />
                {item.tag}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted">{item.visited}</p>
          </div>
        </div>
      </article>
    );
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-muted">History</p>
          <h2 className="text-3xl font-semibold text-foreground">Recently visited</h2>
          <p className="text-sm text-muted">Jump back into a project, resource, or plan instantly.</p>
        </div>
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-muted">
          <button className="rounded-full border border-border px-3 py-1.5 transition hover:bg-accent hover:text-foreground">Projects</button>
          <button className="rounded-full border border-border px-3 py-1.5 transition hover:bg-accent hover:text-foreground">Resources</button>
          <button className="rounded-full border border-border px-3 py-1.5 transition hover:bg-accent hover:text-foreground">Plans</button>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-1.5 text-[11px] text-rose-500 transition hover:bg-accent hover:text-rose-600"
            onClick={handleClearAll}
          >
            모두 제거
          </button>
          <div className="ml-3 flex items-center gap-1">
            <button
              type="button"
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                layout === "grid" ? "border-foreground text-foreground" : "border-border text-muted hover:text-foreground"
              }`}
              aria-label="Grid layout"
              onClick={() => setLayout("grid")}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                layout === "list" ? "border-foreground text-foreground" : "border-border text-muted hover:text-foreground"
              }`}
              aria-label="List layout"
              onClick={() => setLayout("list")}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {recentItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-panel/80 p-6 text-sm text-muted">
          아직 방문 기록이 없습니다. 프로젝트나 문서를 열면 여기에 표시됩니다.
        </div>
      ) : layout === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {recentItems.map((item) => {
            return <CompactCard key={item.id} item={item} size="grid" />;
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {recentItems.map((item) => {
            return <CompactCard key={item.id} item={item} size="list" />;
          })}
        </div>
      )}
    </section>
  );
};

export default RecentVisitedView;
