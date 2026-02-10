// app/(workspace)/workspace/[teamId]/_components/views/ActivitiesView.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, MoreHorizontal } from "lucide-react";
import { useParams } from "next/navigation";
import { fetchTeamActivity, type TeamActivityItem } from "@/lib/activity";
import { useToast } from "@/components/ui/Toast";

const stats = [
  { id: "projects", label: "프로젝트 업데이트", value: 12, helper: "이번 주 +3" },
  { id: "docs", label: "문서 변경", value: 28, helper: "검토 대기 5" },
  { id: "messages", label: "채팅 활동", value: 96, helper: "최근 24시간" },
];

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

type ActivityDay = {
  id: string;
  dateLabel: string;
  dayLabel: string;
  entries: {
    id: string;
    time: string;
    badge?: string;
    action: string;
    detail?: string;
    memberName: string;
  }[];
};

const ActivitiesView = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { show } = useToast();
  const [items, setItems] = useState<TeamActivityItem[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterMember, setFilterMember] = useState("");
  const [filterType, setFilterType] = useState("");
  const filterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!teamId) return;
    const load = async () => {
      try {
        const data = await fetchTeamActivity(teamId);
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch team activity", err);
        show({
          title: "활동 로그 로딩 실패",
          description: "워크스페이스 활동을 불러오지 못했습니다.",
          variant: "error",
        });
      }
    };
    load();
  }, [teamId, show]);

  useEffect(() => {
    if (!filterOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!filterRef.current) return;
      if (!filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  const members = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => {
      if (item.actor?.id && item.actor.name) {
        map.set(item.actor.id, item.actor.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedType = filterType.trim().toLowerCase();
    return items.filter((item) => {
      if (filterMember && item.actor?.id !== filterMember) return false;
      if (filterDate) {
        const createdAt = new Date(item.createdAt);
        const selected = new Date(filterDate);
        if (
          createdAt.getFullYear() !== selected.getFullYear() ||
          createdAt.getMonth() !== selected.getMonth() ||
          createdAt.getDate() !== selected.getDate()
        ) {
          return false;
        }
      }
      if (normalizedType) {
        const target = (item.targetType || "").toLowerCase();
        if (!target.includes(normalizedType)) return false;
      }
      return true;
    });
  }, [filterDate, filterMember, filterType, items]);

  const activityTimeline = useMemo<ActivityDay[]>(() => {
    const grouped = new Map<string, ActivityDay>();
    const formatter = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" });
    const dayFormatter = new Intl.DateTimeFormat("ko-KR", { weekday: "short" });

    filteredItems.forEach((item) => {
      const createdAt = new Date(item.createdAt);
      const dateKey = createdAt.toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          id: dateKey,
          dateLabel: formatter.format(createdAt),
          dayLabel: dayFormatter.format(createdAt),
          entries: [],
        });
      }
      grouped.get(dateKey)!.entries.push({
        id: item.id,
        time: createdAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        badge: item.action?.toUpperCase?.(),
        action: item.message || item.action || "활동",
        detail: item.payload ? JSON.stringify(item.payload) : undefined,
        memberName: item.actor?.name ?? "Unknown",
      });
    });

    return Array.from(grouped.values()).sort((a, b) => (a.id < b.id ? 1 : -1));
  }, [items]);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.id}
            className="rounded-[28px] border border-border bg-panel px-5 py-4 text-foreground shadow-[0_3px_11px_rgba(0,0,0,0.04)]"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-muted">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
            <p className="text-sm text-muted">{item.helper}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[32px] border border-border bg-panel p-6 text-foreground shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-muted">Workspace timeline</p>
            <p className="text-lg font-semibold">Recent activity</p>
          </div>
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-muted transition hover:bg-accent hover:text-foreground"
              onClick={() => setFilterOpen((prev) => !prev)}
              aria-label="필터"
            >
              <Filter size={16} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-border bg-panel p-4 text-xs text-muted shadow-xl">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted">날짜</p>
                    <input
                      type="date"
                      className="h-9 w-full rounded-full border border-border bg-panel px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted">멤버</p>
                    <select
                      className="h-9 w-full rounded-full border border-border bg-panel px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                      value={filterMember}
                      onChange={(e) => setFilterMember(e.target.value)}
                    >
                      <option value="">전체</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted">활동</p>
                    <select
                      className="h-9 w-full rounded-full border border-border bg-panel px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="">전체</option>
                      <option value="project">프로젝트</option>
                      <option value="issue">이슈</option>
                      <option value="chat">채팅</option>
                      <option value="doc">문서</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-full border border-border px-3 py-2 text-[11px] uppercase tracking-[0.3em] text-muted transition hover:bg-accent hover:text-foreground"
                    onClick={() => {
                      setFilterDate("");
                      setFilterMember("");
                      setFilterType("");
                    }}
                  >
                    필터 초기화
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {activityTimeline.map((day) => (
            <div key={day.id} className="space-y-3">
              <div className="flex items-baseline gap-3 text-foreground">
                <span className="text-2xl font-semibold">{day.dateLabel}</span>
                <span className="text-xs uppercase tracking-[0.4em] text-muted">{day.dayLabel}</span>
              </div>

              <div className="space-y-3">
                {day.entries.map((entry) => {
                  return (
                    <div key={entry.id} className="flex items-start gap-4 rounded-2xl border border-border px-4 py-3">
                      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-accent text-sm font-semibold">
                        {getInitials(entry.memberName ?? "?")}
                      </span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between text-xs text-muted">
                          <span>{entry.time}</span>
                          {entry.badge && (
                            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-muted">
                              {entry.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-foreground">
                          <span className="font-semibold">{entry.memberName ?? "Unknown"}</span> {entry.action}
                        </p>
                        {entry.detail && <p className="text-xs text-muted">{entry.detail}</p>}
                      </div>
                      <button type="button" className="text-muted hover:text-foreground" aria-label="More actions">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ActivitiesView;
