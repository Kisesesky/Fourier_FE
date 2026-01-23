'use client';

import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useParams } from "next/navigation";
import { fetchTeamActivity, type TeamActivityItem } from "@/lib/activity";
import { useToast } from "@/components/ui/Toast";

const stats = [
  { id: "deploys", label: "Deployments", value: 18, helper: "+5 vs last week" },
  { id: "changes", label: "Schema changes", value: 12, helper: "4 pending review" },
  { id: "alerts", label: "Alerts", value: 3, helper: "Last triggered 14m ago" },
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

  const activityTimeline = useMemo<ActivityDay[]>(() => {
    const grouped = new Map<string, ActivityDay>();
    const formatter = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" });
    const dayFormatter = new Intl.DateTimeFormat("ko-KR", { weekday: "short" });

    items.forEach((item) => {
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
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted">
            <button type="button" className="rounded-full border border-border px-3 py-1.5 transition hover:bg-accent hover:text-foreground">
              Filters
            </button>
            <button type="button" className="rounded-full border border-border px-3 py-1.5 transition hover:bg-accent hover:text-foreground">
              Export
            </button>
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
