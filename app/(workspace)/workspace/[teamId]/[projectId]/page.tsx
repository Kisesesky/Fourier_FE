// app/(workspace)/workspace/[teamId]/[projectId]/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MessageSquare, FolderKanban, Users, BookText, CalendarDays, Flame, CheckCircle2, Clock4, ArrowUpRight } from "lucide-react";
import { useProject } from "@/hooks/useProject";
import { useChat } from "@/workspace/chat/_model/store";
import { fetchProjectMembers } from "@/lib/projects";
import { listIssues } from "@/workspace/issues/_service/api";
import { getCalendarAnalytics, getCalendarEvents } from "@/workspace/calendar/_service/api";
import { getMessageAnalytics, listMessages } from "@/workspace/chat/_service/api";
import { getIssueAnalytics } from "@/workspace/issues/_service/api";
import { getProjectMemberAnalytics } from "@/lib/projects";
import { getDocsAnalytics } from "@/workspace/docs/_service/api";
import type { CalendarEvent } from "@/workspace/calendar/_model/types";
import type { Issue } from "@/workspace/issues/_model/types";

type WorkspaceProjectPageProps = {
  params: { teamId: string; projectId: string };
};

export default function WorkspaceProjectPage({ params }: WorkspaceProjectPageProps) {
  const teamId = decodeURIComponent(params.teamId);
  const projectId = decodeURIComponent(params.projectId);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "overview";

  const { project, loading, error } = useProject(teamId, projectId);
  const { channels, channelActivity, loadChannels, setContext } = useChat();
  const [memberCount, setMemberCount] = useState(0);
  const [members, setMembers] = useState<Array<{ id: string; name: string; avatarUrl?: string | null; role?: string; joinedAt?: number }>>([]);
  const [issueCount, setIssueCount] = useState(0);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issueStats, setIssueStats] = useState({
    backlog: 0,
    todo: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  });
  const [docStats, setDocStats] = useState({ pages: 0, snapshots: 0, lastSaved: "" });
  const [docSnapshots, setDocSnapshots] = useState<number[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [messageDates, setMessageDates] = useState<number[]>([]);
  const [messageCounts, setMessageCounts] = useState<{ hourly: number[]; daily: number[]; monthly: number[] }>({
    hourly: [],
    daily: [],
    monthly: [],
  });
  const [issueCounts, setIssueCounts] = useState<{ hourly: number[]; daily: number[]; monthly: number[] }>({
    hourly: [],
    daily: [],
    monthly: [],
  });
  const [memberCounts, setMemberCounts] = useState<{ hourly: number[]; daily: number[]; monthly: number[] }>({
    hourly: [],
    daily: [],
    monthly: [],
  });
  const [docCounts, setDocCounts] = useState<{ hourly: number[]; daily: number[]; monthly: number[] }>({
    hourly: [],
    daily: [],
    monthly: [],
  });
  const [calendarCounts, setCalendarCounts] = useState<{ hourly: number[]; daily: number[]; monthly: number[] }>({
    hourly: [],
    daily: [],
    monthly: [],
  });
  const analyticsCacheRef = useRef<Map<string, { counts: number[]; granularity: string }>>(new Map());
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const monthStr = today.toISOString().slice(0, 7);
  const yearStr = String(today.getFullYear());
  const [messageGraphMode, setMessageGraphMode] = useState<"hourly" | "daily" | "monthly">("hourly");
  const [issueGraphMode, setIssueGraphMode] = useState<"hourly" | "daily" | "monthly">("hourly");
  const [memberGraphMode, setMemberGraphMode] = useState<"hourly" | "daily" | "monthly">("hourly");
  const [docGraphMode, setDocGraphMode] = useState<"hourly" | "daily" | "monthly">("hourly");
  const [calendarGraphMode, setCalendarGraphMode] = useState<"hourly" | "daily" | "monthly">("hourly");
  const [messageHourlyDate, setMessageHourlyDate] = useState(todayStr);
  const [messageDailyMonth, setMessageDailyMonth] = useState(monthStr);
  const [messageMonthlyYear, setMessageMonthlyYear] = useState(yearStr);
  const [issueHourlyDate, setIssueHourlyDate] = useState(todayStr);
  const [issueDailyMonth, setIssueDailyMonth] = useState(monthStr);
  const [issueMonthlyYear, setIssueMonthlyYear] = useState(yearStr);
  const [memberHourlyDate, setMemberHourlyDate] = useState(todayStr);
  const [memberDailyMonth, setMemberDailyMonth] = useState(monthStr);
  const [memberMonthlyYear, setMemberMonthlyYear] = useState(yearStr);
  const [docHourlyDate, setDocHourlyDate] = useState(todayStr);
  const [docDailyMonth, setDocDailyMonth] = useState(monthStr);
  const [docMonthlyYear, setDocMonthlyYear] = useState(yearStr);
  const [calendarHourlyDate, setCalendarHourlyDate] = useState(todayStr);
  const [calendarDailyMonth, setCalendarDailyMonth] = useState(monthStr);
  const [calendarMonthlyYear, setCalendarMonthlyYear] = useState(yearStr);
  const iconIsImage = useMemo(() => {
    const value = project?.iconValue ?? "";
    return /^https?:\/\//i.test(value) || value.startsWith("data:");
  }, [project?.iconValue]);

  const issueStatusStyles: Record<string, string> = {
    backlog: "bg-zinc-500/15 text-zinc-200 border-zinc-500/40",
    todo: "bg-sky-500/15 text-sky-200 border-sky-500/40",
    in_progress: "bg-amber-500/15 text-amber-200 border-amber-500/40",
    review: "bg-purple-500/15 text-purple-200 border-purple-500/40",
    done: "bg-emerald-500/15 text-emerald-200 border-emerald-500/40",
  };
  const issuePriorityStyles: Record<string, string> = {
    low: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
    medium: "bg-sky-500/10 text-sky-200 border-sky-500/30",
    normal: "bg-zinc-500/10 text-zinc-200 border-zinc-500/30",
    high: "bg-amber-500/10 text-amber-200 border-amber-500/30",
    urgent: "bg-rose-500/10 text-rose-200 border-rose-500/30",
  };

  const buildSeriesFromDates = (dates: number[]) => {
    const now = new Date();
    const todayKey = now.toDateString();
    const hourly = Array.from({ length: 24 }, () => 0);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daily = Array.from({ length: daysInMonth }, () => 0);
    const monthly = Array.from({ length: 12 }, () => 0);

    dates.forEach((ts) => {
      const dt = new Date(ts);
      if (Number.isNaN(dt.getTime())) return;
      if (dt.toDateString() === todayKey) {
        hourly[dt.getHours()] += 1;
      }
      if (dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth()) {
        daily[dt.getDate() - 1] += 1;
      }
      if (dt.getFullYear() === now.getFullYear()) {
        monthly[dt.getMonth()] += 1;
      }
    });
    return { hourly, daily, monthly };
  };

  const filterDates = (dates: number[], mode: "hourly" | "daily" | "monthly", filter: { day: string; month: string; year: string }) => {
    if (!dates.length) return dates;
    if (mode === "hourly") {
      const target = new Date(filter.day);
      if (Number.isNaN(target.getTime())) return [];
      return dates.filter((ts) => {
        const dt = new Date(ts);
        return dt.toDateString() === target.toDateString();
      });
    }
    if (mode === "daily") {
      const [y, m] = filter.month.split("-").map(Number);
      if (!y || !m) return [];
      return dates.filter((ts) => {
        const dt = new Date(ts);
        return dt.getFullYear() === y && dt.getMonth() + 1 === m;
      });
    }
    const y = Number(filter.year);
    if (!y) return [];
    return dates.filter((ts) => new Date(ts).getFullYear() === y);
  };

  const renderBars = (values: number[], height = 80) => {
    const max = Math.max(...values, 1);
    return (
      <div
        className="grid items-end gap-1"
        style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}
      >
        {values.map((value, idx) => (
          <div key={idx} className="group relative flex w-full flex-col items-center">
            <div
              className={`w-full rounded-none bg-sky-400/90 ${value > 0 ? "opacity-100" : "opacity-0"}`}
              style={{ height: value > 0 ? `${Math.round((value / max) * height)}px` : "0px" }}
              title={value > 0 ? `${value}` : ""}
            />
            {value > 0 && (
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-full border border-border bg-panel px-2 py-0.5 text-[10px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
                {value}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderGraphTabs = (mode: "hourly" | "daily" | "monthly", setMode: (value: "hourly" | "daily" | "monthly") => void) => (
    <div className="inline-flex w-[190px] justify-between rounded-full border border-border bg-panel p-1 text-[11px] text-muted">
      {([
        { key: "hourly", label: "시간대" },
        { key: "daily", label: "일별" },
        { key: "monthly", label: "월별" },
      ] as const).map((item) => (
        <button
          key={item.key}
          type="button"
          className={`rounded-full px-3 py-2 transition ${mode === item.key ? "bg-accent text-foreground" : "hover:text-foreground"}`}
          onClick={() => setMode(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  const renderGraphFilter = (
    mode: "hourly" | "daily" | "monthly",
    filter: { day: string; month: string; year: string },
    setFilter: (next: { day: string; month: string; year: string }) => void
  ) => {
    const sizeClass = "w-[190px] rounded-full border border-border bg-panel px-3 py-2 text-[11px] text-muted text-center";
    if (mode === "hourly") {
      return (
        <input
          type="date"
          value={filter.day}
          onChange={(e) => setFilter({ ...filter, day: e.target.value })}
          className={sizeClass}
        />
      );
    }
    if (mode === "daily") {
      return (
        <input
          type="month"
          value={filter.month}
          onChange={(e) => setFilter({ ...filter, month: e.target.value })}
          className={sizeClass}
        />
      );
    }
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, idx) => String(currentYear - idx));
    return (
      <select
        value={filter.year}
        onChange={(e) => setFilter({ ...filter, year: e.target.value })}
        className={`${sizeClass} pr-8`}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}년
          </option>
        ))}
      </select>
    );
  };

  const pad2 = (value: number) => String(value).padStart(2, "0");
  const hasAny = (values: number[]) => values.some((v) => v > 0);
  const renderRangeLabels = (mode: "hourly" | "daily" | "monthly", count: number) => {
    const items =
      mode === "hourly"
        ? Array.from({ length: 24 }, (_, idx) => String(idx))
        : mode === "daily"
        ? Array.from({ length: count }, (_, idx) => `${pad2(idx + 1)}일`)
        : Array.from({ length: 12 }, (_, idx) => `${idx + 1}월`);
    return (
      <div
        className="mt-3 grid text-[9px] text-muted"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, gap: "4px" }}
      >
        {items.map((label) => (
          <span key={label} className="text-center">
            {label}
          </span>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (!teamId || !projectId) return;
    setContext(teamId, projectId);
  }, [projectId, setContext, teamId]);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    if (!teamId || !projectId) return;
    fetchProjectMembers(teamId, projectId)
      .then((data) => {
        const list = (data ?? []).map((member: { userId?: string; id?: string; name: string; avatarUrl?: string | null; role?: string; joinedAt?: string; createdAt?: string }) => ({
          id: member.userId ?? member.id ?? member.name,
          name: member.name,
          avatarUrl: member.avatarUrl ?? null,
          role: member.role,
          joinedAt: member.joinedAt ? new Date(member.joinedAt).getTime() : member.createdAt ? new Date(member.createdAt).getTime() : undefined,
        }));
        setMemberCount(list.length);
        setMembers(list);
      })
      .catch(() => {
        setMemberCount(0);
        setMembers([]);
      });
    listIssues(projectId)
      .then((data) => {
        const list = data ?? [];
        setIssues(list);
        setIssueCount(list.length);
        setIssueStats({
          backlog: list.filter((i) => i.status === "backlog").length,
          todo: list.filter((i) => i.status === "todo").length,
          in_progress: list.filter((i) => i.status === "in_progress").length,
          review: list.filter((i) => i.status === "review").length,
          done: list.filter((i) => i.status === "done").length,
        });
      })
      .catch(() => {
        setIssues([]);
        setIssueCount(0);
        setIssueStats({ backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 });
      });
  }, [projectId, teamId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const extractDocStats = () => {
      try {
        const keys = Object.keys(window.localStorage);
        let pages = 0;
        let snapshots = 0;
        let lastSaved = 0;
        const snapshotTimes: number[] = [];
        keys.forEach((key) => {
          if (key.startsWith("fd.docs.content:")) pages += 1;
          if (key.startsWith("fd.docs.snapshots:")) {
            const raw = window.localStorage.getItem(key);
            if (!raw) return;
            const parsed = JSON.parse(raw) as { ts?: number }[];
            if (Array.isArray(parsed)) {
              snapshots += parsed.length;
              parsed.forEach((snap) => {
                if (snap?.ts && snap.ts > lastSaved) lastSaved = snap.ts;
                if (snap?.ts) snapshotTimes.push(snap.ts);
              });
            }
          }
        });
        setDocStats({
          pages,
          snapshots,
          lastSaved: lastSaved ? new Date(lastSaved).toISOString() : "",
        });
        setDocSnapshots(snapshotTimes);
      } catch {
        setDocStats({ pages: 0, snapshots: 0, lastSaved: "" });
        setDocSnapshots([]);
      }
    };
    extractDocStats();
    window.addEventListener("docs:snapshots:changed", extractDocStats);
    window.addEventListener("storage", extractDocStats);
    return () => {
      window.removeEventListener("docs:snapshots:changed", extractDocStats);
      window.removeEventListener("storage", extractDocStats);
    };
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 14);
    getCalendarEvents({ start: start.toISOString(), end: end.toISOString(), projectId })
      .then((data) => {
        const list = data.events ?? [];
        const sorted = list
          .filter((event) => new Date(event.start) >= start)
          .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
          .slice(0, 4);
        setUpcomingEvents(sorted);
      })
      .catch(() => setUpcomingEvents([]));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    getCalendarEvents({ start: start.toISOString(), end: end.toISOString(), projectId })
      .then((data) => {
        setCalendarEvents(data.events ?? []);
      })
      .catch(() => setCalendarEvents([]));
  }, [projectId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextDates: number[] = [];
    channels.forEach((channel) => {
      try {
        const raw = window.localStorage.getItem(`fd.chat.messages:${channel.id}`);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Array<{ ts?: number; createdAt?: string }>;
        if (!Array.isArray(parsed)) return;
        parsed.forEach((msg) => {
          if (msg?.ts) nextDates.push(msg.ts);
          else if (msg?.createdAt) {
            const t = new Date(msg.createdAt).getTime();
            if (!Number.isNaN(t)) nextDates.push(t);
          }
        });
      } catch {
        return;
      }
    });
    setMessageDates(nextDates);
  }, [channels]);

  useEffect(() => {
    if (!channels.length) return;
    let mounted = true;
    const loadMessageDates = async () => {
      try {
        const results = await Promise.allSettled(
          channels.map(async (channel) => {
            const list = await listMessages(channel.id);
            return list.map((msg) => new Date(msg.createdAt).getTime()).filter((ts) => !Number.isNaN(ts));
          })
        );
        const merged = results.flatMap((res) => (res.status === "fulfilled" ? res.value : []));
        if (mounted && merged.length) {
          setMessageDates(merged);
        }
      } catch {
        return;
      }
    };
    void loadMessageDates();
    return () => {
      mounted = false;
    };
  }, [channels]);

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    const timer = window.setTimeout(async () => {
      try {
        const keys = {
          hourly: `chat:${projectId}:hourly:${messageHourlyDate}`,
          daily: `chat:${projectId}:daily:${messageDailyMonth}`,
          monthly: `chat:${projectId}:monthly:${messageMonthlyYear}`,
        };
        const cachedHourly = analyticsCacheRef.current.get(keys.hourly);
        const cachedDaily = analyticsCacheRef.current.get(keys.daily);
        const cachedMonthly = analyticsCacheRef.current.get(keys.monthly);
        const [hourly, daily, monthly] = await Promise.all([
          cachedHourly ? Promise.resolve(cachedHourly) : getMessageAnalytics({ projectId, granularity: "hourly", date: messageHourlyDate }),
          cachedDaily ? Promise.resolve(cachedDaily) : getMessageAnalytics({ projectId, granularity: "daily", month: messageDailyMonth }),
          cachedMonthly ? Promise.resolve(cachedMonthly) : getMessageAnalytics({ projectId, granularity: "monthly", year: messageMonthlyYear }),
        ]);
        if (!cachedHourly) analyticsCacheRef.current.set(keys.hourly, hourly);
        if (!cachedDaily) analyticsCacheRef.current.set(keys.daily, daily);
        if (!cachedMonthly) analyticsCacheRef.current.set(keys.monthly, monthly);
        if (!mounted) return;
        setMessageCounts({
          hourly: hourly?.counts ?? [],
          daily: daily?.counts ?? [],
          monthly: monthly?.counts ?? [],
        });
      } catch {
        return;
      }
    }, 250);
    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [projectId, messageDailyMonth, messageHourlyDate, messageMonthlyYear]);

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    const timer = window.setTimeout(async () => {
      try {
        const keys = {
          hourly: `issues:${projectId}:hourly:${issueHourlyDate}`,
          daily: `issues:${projectId}:daily:${issueDailyMonth}`,
          monthly: `issues:${projectId}:monthly:${issueMonthlyYear}`,
        };
        const cachedHourly = analyticsCacheRef.current.get(keys.hourly);
        const cachedDaily = analyticsCacheRef.current.get(keys.daily);
        const cachedMonthly = analyticsCacheRef.current.get(keys.monthly);
        const [hourly, daily, monthly] = await Promise.all([
          cachedHourly ? Promise.resolve(cachedHourly) : getIssueAnalytics(projectId, { granularity: "hourly", date: issueHourlyDate }),
          cachedDaily ? Promise.resolve(cachedDaily) : getIssueAnalytics(projectId, { granularity: "daily", month: issueDailyMonth }),
          cachedMonthly ? Promise.resolve(cachedMonthly) : getIssueAnalytics(projectId, { granularity: "monthly", year: issueMonthlyYear }),
        ]);
        if (!cachedHourly) analyticsCacheRef.current.set(keys.hourly, hourly);
        if (!cachedDaily) analyticsCacheRef.current.set(keys.daily, daily);
        if (!cachedMonthly) analyticsCacheRef.current.set(keys.monthly, monthly);
        if (!mounted) return;
        setIssueCounts({
          hourly: hourly?.counts ?? [],
          daily: daily?.counts ?? [],
          monthly: monthly?.counts ?? [],
        });
      } catch {
        return;
      }
    }, 250);
    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [issueDailyMonth, issueHourlyDate, issueMonthlyYear, projectId]);

  useEffect(() => {
    if (!projectId || !teamId) return;
    let mounted = true;
    const timer = window.setTimeout(async () => {
      try {
        const keys = {
          hourly: `members:${projectId}:hourly:${memberHourlyDate}`,
          daily: `members:${projectId}:daily:${memberDailyMonth}`,
          monthly: `members:${projectId}:monthly:${memberMonthlyYear}`,
        };
        const cachedHourly = analyticsCacheRef.current.get(keys.hourly);
        const cachedDaily = analyticsCacheRef.current.get(keys.daily);
        const cachedMonthly = analyticsCacheRef.current.get(keys.monthly);
        const [hourly, daily, monthly] = await Promise.all([
          cachedHourly ? Promise.resolve(cachedHourly) : getProjectMemberAnalytics(teamId, projectId, { granularity: "hourly", date: memberHourlyDate }),
          cachedDaily ? Promise.resolve(cachedDaily) : getProjectMemberAnalytics(teamId, projectId, { granularity: "daily", month: memberDailyMonth }),
          cachedMonthly ? Promise.resolve(cachedMonthly) : getProjectMemberAnalytics(teamId, projectId, { granularity: "monthly", year: memberMonthlyYear }),
        ]);
        if (!cachedHourly) analyticsCacheRef.current.set(keys.hourly, hourly);
        if (!cachedDaily) analyticsCacheRef.current.set(keys.daily, daily);
        if (!cachedMonthly) analyticsCacheRef.current.set(keys.monthly, monthly);
        if (!mounted) return;
        setMemberCounts({
          hourly: hourly?.counts ?? [],
          daily: daily?.counts ?? [],
          monthly: monthly?.counts ?? [],
        });
      } catch {
        return;
      }
    }, 250);
    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [memberDailyMonth, memberHourlyDate, memberMonthlyYear, projectId, teamId]);

  useEffect(() => {
    let mounted = true;
    const timer = window.setTimeout(async () => {
      try {
        const keys = {
          hourly: `docs:hourly:${docHourlyDate}`,
          daily: `docs:daily:${docDailyMonth}`,
          monthly: `docs:monthly:${docMonthlyYear}`,
        };
        const cachedHourly = analyticsCacheRef.current.get(keys.hourly);
        const cachedDaily = analyticsCacheRef.current.get(keys.daily);
        const cachedMonthly = analyticsCacheRef.current.get(keys.monthly);
        const [hourly, daily, monthly] = await Promise.all([
          cachedHourly ? Promise.resolve(cachedHourly) : getDocsAnalytics({ granularity: "hourly", date: docHourlyDate }),
          cachedDaily ? Promise.resolve(cachedDaily) : getDocsAnalytics({ granularity: "daily", month: docDailyMonth }),
          cachedMonthly ? Promise.resolve(cachedMonthly) : getDocsAnalytics({ granularity: "monthly", year: docMonthlyYear }),
        ]);
        if (!cachedHourly) analyticsCacheRef.current.set(keys.hourly, hourly);
        if (!cachedDaily) analyticsCacheRef.current.set(keys.daily, daily);
        if (!cachedMonthly) analyticsCacheRef.current.set(keys.monthly, monthly);
        if (!mounted) return;
        setDocCounts({
          hourly: hourly?.counts ?? [],
          daily: daily?.counts ?? [],
          monthly: monthly?.counts ?? [],
        });
      } catch {
        return;
      }
    }, 250);
    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [docDailyMonth, docHourlyDate, docMonthlyYear]);

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    const timer = window.setTimeout(async () => {
      try {
        const keys = {
          hourly: `calendar:${projectId}:hourly:${calendarHourlyDate}`,
          daily: `calendar:${projectId}:daily:${calendarDailyMonth}`,
          monthly: `calendar:${projectId}:monthly:${calendarMonthlyYear}`,
        };
        const cachedHourly = analyticsCacheRef.current.get(keys.hourly);
        const cachedDaily = analyticsCacheRef.current.get(keys.daily);
        const cachedMonthly = analyticsCacheRef.current.get(keys.monthly);
        const [hourly, daily, monthly] = await Promise.all([
          cachedHourly ? Promise.resolve(cachedHourly) : getCalendarAnalytics(projectId, { granularity: "hourly", date: calendarHourlyDate }),
          cachedDaily ? Promise.resolve(cachedDaily) : getCalendarAnalytics(projectId, { granularity: "daily", month: calendarDailyMonth }),
          cachedMonthly ? Promise.resolve(cachedMonthly) : getCalendarAnalytics(projectId, { granularity: "monthly", year: calendarMonthlyYear }),
        ]);
        if (!cachedHourly) analyticsCacheRef.current.set(keys.hourly, hourly);
        if (!cachedDaily) analyticsCacheRef.current.set(keys.daily, daily);
        if (!cachedMonthly) analyticsCacheRef.current.set(keys.monthly, monthly);
        if (!mounted) return;
        setCalendarCounts({
          hourly: hourly?.counts ?? [],
          daily: daily?.counts ?? [],
          monthly: monthly?.counts ?? [],
        });
      } catch {
        return;
      }
    }, 250);
    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [calendarDailyMonth, calendarHourlyDate, calendarMonthlyYear, projectId]);

  useEffect(() => {
    if (!project) return;
    if (typeof window === "undefined") return;
    if (!pathname) return;
    const STORAGE_KEY = "recently-visited";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
      const next = parsed.map((item) => {
        if (item.path !== pathname) return item;
        return {
          ...item,
          title: project.name,
          description: project.description || "프로젝트",
          tag: "Project",
          iconValue: project.iconValue ?? "",
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("recently-visited:update"));
    } catch (err) {
      console.error("Failed to update recent visited title", err);
    }
  }, [pathname, project]);

  if (loading) {
    return <div className="px-8 py-6 text-muted">프로젝트 불러오는 중…</div>;
  }

  if (error || !project) {
    return (
      <div className="px-8 py-6 text-red-500">
        {error ?? "프로젝트를 찾을 수 없습니다."}
      </div>
    );
  }

  const renderHeader = (label?: string, action?: React.ReactNode) => (
    <section className="rounded-3xl border border-border bg-panel/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.4em] text-muted">{label ?? "Project Dashboard"}</p>
        {action}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="h-12 w-12 overflow-hidden rounded-2xl border border-border bg-muted/30">
          {iconIsImage ? (
            <img src={project.iconValue} alt={project.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-foreground">
              {project.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
      </div>
    </section>
  );

  const renderIssueSummary = () => (
    <section className="rounded-2xl border border-border bg-panel/70 p-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <CheckCircle2 size={16} /> 이슈 상태 요약
      </div>
      <div className="mt-4 space-y-3">
        {([
          { key: "backlog", label: "Backlog", color: "bg-zinc-500", value: issueStats.backlog },
          { key: "todo", label: "Todo", color: "bg-sky-500", value: issueStats.todo },
          { key: "in_progress", label: "In Progress", color: "bg-amber-500", value: issueStats.in_progress },
          { key: "review", label: "Review", color: "bg-purple-500", value: issueStats.review },
          { key: "done", label: "Done", color: "bg-emerald-500", value: issueStats.done },
        ] as const).map((row) => {
          const total = issueCount || 1;
          const pct = Math.round((row.value / total) * 100);
          return (
            <div key={row.key} className="flex items-center gap-3">
              <div className="w-24 text-xs text-muted">{row.label}</div>
              <div className="flex-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
                  <div className={`h-full ${row.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="w-12 text-right text-xs text-muted">{row.value}</div>
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderOverview = () => (
    <>
      {renderHeader()}

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-panel/70 p-6">
          <div className="flex items-center justify-between text-sm text-muted">
            <span className="flex items-center gap-2"><MessageSquare size={16} /> 채널</span>
            <span className="text-xs text-muted">Active</span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{channels.length}</div>
        </div>
        <div className="rounded-2xl border border-border bg-panel/70 p-6">
          <div className="flex items-center justify-between text-sm text-muted">
            <span className="flex items-center gap-2"><FolderKanban size={16} /> 이슈</span>
            <span className="text-xs text-muted">Open</span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{issueCount}</div>
        </div>
        <div className="rounded-2xl border border-border bg-panel/70 p-6">
          <div className="flex items-center justify-between text-sm text-muted">
            <span className="flex items-center gap-2"><Users size={16} /> 멤버</span>
            <span className="text-xs text-muted">Active</span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{memberCount}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-panel/70 p-6">
        <div className="flex items-center justify-between text-sm text-muted">
          <span className="flex items-center gap-2"><ArrowUpRight size={16} /> 빠른 이동</span>
          <span className="text-xs text-muted">모듈 바로가기</span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            className="flex items-center justify-between rounded-xl border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
            onClick={() => router.push(`${pathname}?view=chat`)}
          >
            <span className="flex items-center gap-2 text-foreground"><MessageSquare size={14} /> 채널</span>
            <span className="text-[11px] text-muted">상세 보기</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-between rounded-xl border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
            onClick={() => router.push(`${pathname}?view=issues`)}
          >
            <span className="flex items-center gap-2 text-foreground"><FolderKanban size={14} /> 이슈</span>
            <span className="text-[11px] text-muted">상세 보기</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-between rounded-xl border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
            onClick={() => router.push(`${pathname}?view=members`)}
          >
            <span className="flex items-center gap-2 text-foreground"><Users size={14} /> 멤버</span>
            <span className="text-[11px] text-muted">상세 보기</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-between rounded-xl border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
            onClick={() => router.push(`${pathname}?view=docs`)}
          >
            <span className="flex items-center gap-2 text-foreground"><BookText size={14} /> Docs</span>
            <span className="text-[11px] text-muted">상세 보기</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-between rounded-xl border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
            onClick={() => router.push(`${pathname}?view=calendar`)}
          >
            <span className="flex items-center gap-2 text-foreground"><CalendarDays size={14} /> 일정</span>
            <span className="text-[11px] text-muted">상세 보기</span>
          </button>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-border bg-panel/70 p-6">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Flame size={16} /> 최근 채널 활동
          </div>
          <div className="mt-4 space-y-4">
            {channels
              .map((ch) => ({
                id: ch.id,
                name: ch.name,
                lastTs: channelActivity[ch.id]?.lastMessageTs ?? 0,
                preview: channelActivity[ch.id]?.lastPreview ?? "최근 메시지 없음",
              }))
              .sort((a, b) => b.lastTs - a.lastTs)
              .slice(0, 4)
              .map((entry) => (
                <div key={entry.id} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-brand/80" />
                  <div className="rounded-xl border border-border/60 bg-panel px-3 py-2">
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span className="font-semibold text-foreground">#{entry.name}</span>
                      <span>
                        {entry.lastTs ? new Date(entry.lastTs).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-[11px] text-muted">{entry.preview}</div>
                  </div>
                </div>
              ))}
            {channels.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
                아직 채널이 없습니다.
              </div>
            )}
          </div>
        </div>
        <div className="grid gap-5">
          <div className="rounded-2xl border border-border bg-panel/70 p-6">
            <div className="flex items-center gap-2 text-sm text-muted">
              <BookText size={16} /> Docs
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-muted">
              <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                <div className="text-[11px]">페이지</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{docStats.pages}</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                <div className="text-[11px]">스냅샷</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{docStats.snapshots}</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                <div className="text-[11px]">최근 저장</div>
                <div className="mt-1 text-[11px] text-muted">
                  {docStats.lastSaved ? new Date(docStats.lastSaved).toLocaleDateString() : "-"}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-panel/70 p-6">
            <div className="flex items-center gap-2 text-sm text-muted">
              <CalendarDays size={16} /> 일정
            </div>
            <div className="mt-3 space-y-2">
              {upcomingEvents.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
                  다가오는 일정이 없습니다.
                </div>
              )}
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-2 rounded-lg border border-border/60 bg-panel px-3 py-2">
                  <Clock4 size={14} className="text-muted" />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-foreground">{event.title}</div>
                    <div className="text-[11px] text-muted">
                      {new Date(event.start).toLocaleDateString()} · {new Date(event.start).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {renderIssueSummary()}
    </>
  );

  const renderDetail = () => {
    switch (view) {
      case "chat":
        return (
          <>
            {renderHeader(
              "Channel Dashboard",
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent"
                onClick={() => router.push(`${pathname}/chat`)}
              >
                채널로 이동 <ArrowUpRight size={12} />
              </button>
            )}
            <section className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><MessageSquare size={16} /> 채널 수</span>
                  <span className="text-xs text-muted">Total</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{channels.length}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Flame size={16} /> 활성 채널</span>
                  <span className="text-xs text-muted">24h</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {channels.filter((ch) => (channelActivity[ch.id]?.lastMessageTs ?? 0) > Date.now() - 24 * 60 * 60 * 1000).length}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Users size={16} /> 멤버</span>
                  <span className="text-xs text-muted">Active</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{memberCount}</div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Flame size={16} /> 채널 활동 타임라인
                </div>
                <div className="mt-4 space-y-3">
                  {channels
                    .map((ch) => ({
                      id: ch.id,
                      name: ch.name,
                      lastTs: channelActivity[ch.id]?.lastMessageTs ?? 0,
                      preview: channelActivity[ch.id]?.lastPreview ?? "최근 메시지 없음",
                    }))
                    .sort((a, b) => b.lastTs - a.lastTs)
                    .slice(0, 8)
                    .map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-border/60 bg-panel px-3 py-2">
                        <div className="flex items-center justify-between text-[11px] text-muted">
                          <span className="font-semibold text-foreground">#{entry.name}</span>
                          <span>{entry.lastTs ? new Date(entry.lastTs).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "-"}</span>
                        </div>
                        <div className="mt-1 truncate text-[11px] text-muted">{entry.preview}</div>
                      </div>
                    ))}
                  {channels.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
                      아직 채널이 없습니다.
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-5">
                <div className="rounded-2xl border border-border bg-panel/70 p-6">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <MessageSquare size={16} /> 채널 리스트
                  </div>
                <div className="mt-3 space-y-2">
                  {channels.slice(0, 8).map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
                      onClick={() => router.push(`${pathname}/chat/${encodeURIComponent(ch.id)}`)}
                    >
                      <span className="font-semibold text-foreground">#{ch.name}</span>
                        <span className="flex items-center gap-2">
                          <span className="rounded-full border border-border/60 bg-panel px-2 py-0.5 text-[10px] text-muted">
                            {channelActivity[ch.id]?.lastMessageTs ? new Date(channelActivity[ch.id]?.lastMessageTs ?? 0).toLocaleDateString() : "-"}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] ${
                              (channelActivity[ch.id]?.lastMessageTs ?? 0) > Date.now() - 24 * 60 * 60 * 1000
                                ? "border-sky-500/40 bg-sky-500/15 text-sky-200"
                                : "border-zinc-500/40 bg-zinc-500/15 text-zinc-200"
                            }`}
                          >
                            {(channelActivity[ch.id]?.lastMessageTs ?? 0) > Date.now() - 24 * 60 * 60 * 1000 ? "활성" : "휴면"}
                          </span>
                        </span>
                    </button>
                  ))}
                    {channels.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
                        채널 목록이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-panel/70 p-6">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Users size={16} /> 최근 참여 멤버
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {members.slice(0, 10).map((member) => (
                      <div key={member.id} className="flex items-center gap-2 rounded-full border border-border/60 bg-panel px-2 py-1 text-xs">
                        <div className="h-6 w-6 overflow-hidden rounded-full border border-border bg-muted/40">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-foreground">
                              {member.name.slice(0, 1)}
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-foreground">{member.name}</span>
                      </div>
                    ))}
                    {members.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
                        멤버 정보를 불러오지 못했습니다.
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-panel/70 p-6">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <MessageSquare size={16} /> 채널 상태 요약
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                      <div className="text-muted">24h 활동</div>
                      <div className="mt-1 text-sm font-semibold text-foreground">
                        {channels.filter((ch) => (channelActivity[ch.id]?.lastMessageTs ?? 0) > Date.now() - 24 * 60 * 60 * 1000).length}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                      <div className="text-muted">휴면 채널</div>
                      <div className="mt-1 text-sm font-semibold text-foreground">
                        {channels.filter((ch) => (channelActivity[ch.id]?.lastMessageTs ?? 0) === 0).length}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                      <div className="text-muted">최근 메시지</div>
                      <div className="mt-1 text-sm font-semibold text-foreground">
                        {channels.length ? Math.max(...channels.map((ch) => channelActivity[ch.id]?.lastMessageTs ?? 0)) > 0 ? "있음" : "없음" : "없음"}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                      <div className="text-muted">총 채널</div>
                      <div className="mt-1 text-sm font-semibold text-foreground">{channels.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-panel/70 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-muted">
                <span className="flex items-center gap-2"><Clock4 size={16} /> 메시지 그래프</span>
                <div className="flex flex-col items-end gap-2">
                  {renderGraphFilter(
                    messageGraphMode,
                    { day: messageHourlyDate, month: messageDailyMonth, year: messageMonthlyYear },
                    (next) => {
                      setMessageHourlyDate(next.day);
                      setMessageDailyMonth(next.month);
                      setMessageMonthlyYear(next.year);
                    }
                  )}
                  {renderGraphTabs(messageGraphMode, setMessageGraphMode)}
                </div>
              </div>
              <div className="mt-4">
                {(messageCounts.hourly.length || messageDates.length) ? (
                  <>
                    {messageGraphMode === "hourly" &&
                      renderBars(
                        messageCounts.hourly.length
                          ? messageCounts.hourly
                          : buildSeriesFromDates(filterDates(messageDates, "hourly", { day: messageHourlyDate, month: messageDailyMonth, year: messageMonthlyYear })).hourly,
                        144
                      )}
                    {messageGraphMode === "daily" &&
                      renderBars(
                        messageCounts.daily.length
                          ? messageCounts.daily
                          : buildSeriesFromDates(filterDates(messageDates, "daily", { day: messageHourlyDate, month: messageDailyMonth, year: messageMonthlyYear })).daily,
                        144
                      )}
                    {messageGraphMode === "monthly" &&
                      renderBars(
                        messageCounts.monthly.length
                          ? messageCounts.monthly
                          : buildSeriesFromDates(filterDates(messageDates, "monthly", { day: messageHourlyDate, month: messageDailyMonth, year: messageMonthlyYear })).monthly,
                        144
                      )}
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-xs text-muted">메시지 데이터가 없습니다.</div>
                )}
              </div>
              {messageGraphMode === "hourly" && renderRangeLabels("hourly", 24)}
              {messageGraphMode === "daily" && renderRangeLabels("daily", buildSeriesFromDates(filterDates(messageDates, "daily", { day: messageHourlyDate, month: messageDailyMonth, year: messageMonthlyYear })).daily.length)}
              {messageGraphMode === "monthly" && renderRangeLabels("monthly", 12)}
            </section>
          </>
        );
      case "issues":
        return (
          <>
            {renderHeader(
              "Issue Dashboard",
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent"
                onClick={() => router.push(`${pathname}/issues`)}
              >
                이슈로 이동 <ArrowUpRight size={12} />
              </button>
            )}
            <section className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><FolderKanban size={16} /> 총 이슈</span>
                  <span className="text-xs text-muted">Open</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{issueCount}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-4">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><CheckCircle2 size={16} /> 완료</span>
                  <span className="text-xs text-muted">Done</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{issueStats.done}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-4">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Clock4 size={16} /> 진행중</span>
                  <span className="text-xs text-muted">In Progress</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{issueStats.in_progress}</div>
              </div>
            </section>
            {renderIssueSummary()}
            <section className="rounded-2xl border border-border bg-panel/70 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-muted">
                <span className="flex items-center gap-2"><Clock4 size={16} /> 이슈 그래프</span>
                <div className="flex flex-col items-end gap-2">
                  {renderGraphFilter(
                    issueGraphMode,
                    { day: issueHourlyDate, month: issueDailyMonth, year: issueMonthlyYear },
                    (next) => {
                      setIssueHourlyDate(next.day);
                      setIssueDailyMonth(next.month);
                      setIssueMonthlyYear(next.year);
                    }
                  )}
                  {renderGraphTabs(issueGraphMode, setIssueGraphMode)}
                </div>
              </div>
              <div className="mt-4">
                {issueGraphMode === "hourly" &&
                  renderBars(
                    issueCounts.hourly.length
                      ? issueCounts.hourly
                      : buildSeriesFromDates(filterDates(issues.map((i) => new Date(i.updatedAt || i.createdAt).getTime()).filter((ts) => !Number.isNaN(ts)), "hourly", { day: issueHourlyDate, month: issueDailyMonth, year: issueMonthlyYear })).hourly,
                    72
                  )}
                {issueGraphMode === "daily" &&
                  renderBars(
                    issueCounts.daily.length
                      ? issueCounts.daily
                      : buildSeriesFromDates(filterDates(issues.map((i) => new Date(i.updatedAt || i.createdAt).getTime()).filter((ts) => !Number.isNaN(ts)), "daily", { day: issueHourlyDate, month: issueDailyMonth, year: issueMonthlyYear })).daily,
                    72
                  )}
                {issueGraphMode === "monthly" &&
                  renderBars(
                    issueCounts.monthly.length
                      ? issueCounts.monthly
                      : buildSeriesFromDates(filterDates(issues.map((i) => new Date(i.updatedAt || i.createdAt).getTime()).filter((ts) => !Number.isNaN(ts)), "monthly", { day: issueHourlyDate, month: issueDailyMonth, year: issueMonthlyYear })).monthly,
                    72
                  )}
              </div>
              {issueGraphMode === "hourly" && renderRangeLabels("hourly", 24)}
              {issueGraphMode === "daily" && renderRangeLabels("daily", buildSeriesFromDates(filterDates(issues.map((i) => new Date(i.updatedAt || i.createdAt).getTime()).filter((ts) => !Number.isNaN(ts)), "daily", { day: issueHourlyDate, month: issueDailyMonth, year: issueMonthlyYear })).daily.length)}
              {issueGraphMode === "monthly" && renderRangeLabels("monthly", 12)}
            </section>
            <section className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Clock4 size={16} /> 진행률</span>
                  <span className="text-xs text-muted">Done</span>
                </div>
                <div className="mt-3 text-2xl font-semibold">
                  {issueCount ? Math.round((issueStats.done / issueCount) * 100) : 0}%
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border/60">
                  <div className="h-full bg-emerald-500" style={{ width: `${issueCount ? Math.round((issueStats.done / issueCount) * 100) : 0}%` }} />
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <FolderKanban size={16} /> 상태 분포
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                    <div className="text-muted">Backlog</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{issueStats.backlog}</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                    <div className="text-muted">Todo</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{issueStats.todo}</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                    <div className="text-muted">Review</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{issueStats.review}</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                    <div className="text-muted">In Progress</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{issueStats.in_progress}</div>
                  </div>
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-panel/70 p-6">
              <div className="flex items-center gap-2 text-sm text-muted">
                <FolderKanban size={16} /> 최근 업데이트
              </div>
              <div className="mt-4 space-y-2">
                {issues
                  .slice()
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .slice(0, 6)
                  .map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
                      onClick={() => router.push(`${pathname}/issues/${issue.id}`)}
                    >
                      <span className="truncate font-semibold text-foreground">{issue.title}</span>
                      <span className="flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${issueStatusStyles[issue.status] ?? "border-border/60 bg-panel text-muted"}`}
                        >
                          {issue.status}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${issuePriorityStyles[issue.priority ?? "normal"] ?? "border-border/60 bg-panel text-muted"}`}
                        >
                          {issue.priority ?? "normal"}
                        </span>
                      </span>
                    </button>
                  ))}
                {issues.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
                    최근 이슈가 없습니다.
                  </div>
                )}
              </div>
            </section>
            <section className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <FolderKanban size={16} /> 상태별 이슈
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  {(["backlog", "todo", "in_progress", "review", "done"] as const).map((status) => (
                    <div key={status} className="flex items-center justify-between rounded-lg border border-border/60 bg-panel px-3 py-2">
                      <span className="text-muted">{status}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${issueStatusStyles[status] ?? "border-border/60 bg-panel text-muted"}`}
                      >
                        {issueStats[status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Clock4 size={16} /> 최근 수정 이슈
                </div>
                <div className="mt-4 space-y-2">
                  {issues
                    .slice()
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .slice(0, 4)
                    .map((issue) => (
                      <button
                        key={issue.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
                        onClick={() => router.push(`${pathname}/issues/${issue.id}`)}
                      >
                        <span className="truncate font-semibold text-foreground">{issue.title}</span>
                        <span className="text-[11px] text-muted">{new Date(issue.updatedAt).toLocaleDateString()}</span>
                      </button>
                    ))}
                  {issues.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
                      이슈가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        );
      case "members":
        return (
          <>
            {renderHeader(
              "Members Dashboard",
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent"
                onClick={() => router.push(`${pathname}/members`)}
              >
                멤버로 이동 <ArrowUpRight size={12} />
              </button>
            )}
            <section className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-panel/70 p-4">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Users size={16} /> 멤버</span>
                  <span className="text-xs text-muted">Active</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{memberCount}</div>
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-panel/70 p-6">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Users size={16} /> 참여 멤버
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {members.slice(0, 8).map((member) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-panel px-3 py-2">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted/40">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-foreground">
                          {member.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{member.name}</div>
                      <div className="text-[11px] text-muted">{member.role ?? "Member"}</div>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
                    멤버를 불러오지 못했습니다.
                  </div>
                )}
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-panel/70 p-6">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Users size={16} /> 역할 분포
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                {(["OWNER", "MANAGER", "MEMBER", "GUEST"] as const).map((role) => {
                  const count = members.filter((member) => (member.role ?? "").toUpperCase() === role).length;
                  return (
                    <div key={role} className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                      <div className="text-muted">{role.toLowerCase()}</div>
                      <div className="mt-1 text-sm font-semibold text-foreground">{count}</div>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-panel/70 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-muted">
                <span className="flex items-center gap-2"><Clock4 size={16} /> 멤버 그래프</span>
                <div className="flex flex-col items-end gap-2">
                  {renderGraphFilter(
                    memberGraphMode,
                    { day: memberHourlyDate, month: memberDailyMonth, year: memberMonthlyYear },
                    (next) => {
                      setMemberHourlyDate(next.day);
                      setMemberDailyMonth(next.month);
                      setMemberMonthlyYear(next.year);
                    }
                  )}
                  {renderGraphTabs(memberGraphMode, setMemberGraphMode)}
                </div>
              </div>
              <div className="mt-4">
                {memberGraphMode === "hourly" && ((memberCounts.hourly.length ? memberCounts.hourly : buildSeriesFromDates(filterDates(members.map((m) => m.joinedAt ?? 0).filter(Boolean), "hourly", { day: memberHourlyDate, month: memberDailyMonth, year: memberMonthlyYear })).hourly).some((v) => v > 0) ? renderBars(memberCounts.hourly.length ? memberCounts.hourly : buildSeriesFromDates(filterDates(members.map((m) => m.joinedAt ?? 0).filter(Boolean), "hourly", { day: memberHourlyDate, month: memberDailyMonth, year: memberMonthlyYear })).hourly, 72) : (
                  <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-xs text-muted">멤버 데이터가 없습니다.</div>
                ))}
                {memberGraphMode === "daily" && ((memberCounts.daily.length ? memberCounts.daily : buildSeriesFromDates(filterDates(members.map((m) => m.joinedAt ?? 0).filter(Boolean), "daily", { day: memberHourlyDate, month: memberDailyMonth, year: memberMonthlyYear })).daily).some((v) => v > 0) ? renderBars(memberCounts.daily.length ? memberCounts.daily : buildSeriesFromDates(filterDates(members.map((m) => m.joinedAt ?? 0).filter(Boolean), "daily", { day: memberHourlyDate, month: memberDailyMonth, year: memberMonthlyYear })).daily, 72) : (
                  <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-xs text-muted">멤버 데이터가 없습니다.</div>
                ))}
                {memberGraphMode === "monthly" && ((memberCounts.monthly.length ? memberCounts.monthly : buildSeriesFromDates(filterDates(members.map((m) => m.joinedAt ?? 0).filter(Boolean), "monthly", { day: memberHourlyDate, month: memberDailyMonth, year: memberMonthlyYear })).monthly).some((v) => v > 0) ? renderBars(memberCounts.monthly.length ? memberCounts.monthly : buildSeriesFromDates(filterDates(members.map((m) => m.joinedAt ?? 0).filter(Boolean), "monthly", { day: memberHourlyDate, month: memberDailyMonth, year: memberMonthlyYear })).monthly, 72) : (
                  <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-xs text-muted">멤버 데이터가 없습니다.</div>
                ))}
              </div>
              {memberGraphMode === "hourly" && renderRangeLabels("hourly", 24)}
              {memberGraphMode === "daily" && renderRangeLabels("daily", buildSeriesFromDates(filterDates(members.map((m) => m.joinedAt ?? 0).filter(Boolean), "daily", { day: memberHourlyDate, month: memberDailyMonth, year: memberMonthlyYear })).daily.length)}
              {memberGraphMode === "monthly" && renderRangeLabels("monthly", 12)}
            </section>
            <section className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Users size={16} /> 최근 참여
                </div>
                <div className="mt-4 space-y-2">
                  {members.slice(0, 6).map((member) => (
                    <div key={member.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-panel px-3 py-2 text-xs">
                      <span className="font-semibold text-foreground">{member.name}</span>
                      <span className="text-[11px] text-muted">{member.role ?? "Member"}</span>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
                      멤버가 없습니다.
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Users size={16} /> 멤버 하이라이트
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                    <div className="text-muted">총 멤버</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{memberCount}</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                    <div className="text-muted">현재 표시</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{members.length}</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                    <div className="text-muted">관리자</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {members.filter((member) => (member.role ?? "").toUpperCase() === "OWNER").length}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                    <div className="text-muted">매니저</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {members.filter((member) => (member.role ?? "").toUpperCase() === "MANAGER").length}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        );
      case "docs":
        return (
          <>
            {renderHeader(
              "Docs Dashboard",
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent"
                onClick={() => router.push(`${pathname}/docs`)}
              >
                Docs로 이동 <ArrowUpRight size={12} />
              </button>
            )}
            <section className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><BookText size={16} /> 문서</span>
                  <span className="text-xs text-muted">Pages</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{docStats.pages}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><BookText size={16} /> 스냅샷</span>
                  <span className="text-xs text-muted">Snapshots</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{docStats.snapshots}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Clock4 size={16} /> 최근 저장</span>
                  <span className="text-xs text-muted">Last Saved</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-foreground">
                  {docStats.lastSaved ? new Date(docStats.lastSaved).toLocaleString("ko-KR") : "-"}
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-panel/70 p-6">
              <div className="flex items-center gap-2 text-sm text-muted">
                <BookText size={16} /> 문서 활동 요약
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                  <div className="text-muted">페이지당 스냅샷</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {docStats.pages ? Math.round(docStats.snapshots / docStats.pages) : 0}
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                  <div className="text-muted">최근 저장 상태</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {docStats.lastSaved ? "업데이트됨" : "기록 없음"}
                  </div>
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-panel/70 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-muted">
                <span className="flex items-center gap-2"><Clock4 size={16} /> 문서 그래프</span>
                <div className="flex flex-col items-end gap-2">
                  {renderGraphFilter(
                    docGraphMode,
                    { day: docHourlyDate, month: docDailyMonth, year: docMonthlyYear },
                    (next) => {
                      setDocHourlyDate(next.day);
                      setDocDailyMonth(next.month);
                      setDocMonthlyYear(next.year);
                    }
                  )}
                  {renderGraphTabs(docGraphMode, setDocGraphMode)}
                </div>
              </div>
              <div className="mt-4">
                {docGraphMode === "hourly" && ((docCounts.hourly.length ? docCounts.hourly : buildSeriesFromDates(filterDates(docSnapshots, "hourly", { day: docHourlyDate, month: docDailyMonth, year: docMonthlyYear })).hourly).some((v) => v > 0) ? renderBars(docCounts.hourly.length ? docCounts.hourly : buildSeriesFromDates(filterDates(docSnapshots, "hourly", { day: docHourlyDate, month: docDailyMonth, year: docMonthlyYear })).hourly, 72) : (
                  <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-xs text-muted">문서 데이터가 없습니다.</div>
                ))}
                {docGraphMode === "daily" && ((docCounts.daily.length ? docCounts.daily : buildSeriesFromDates(filterDates(docSnapshots, "daily", { day: docHourlyDate, month: docDailyMonth, year: docMonthlyYear })).daily).some((v) => v > 0) ? renderBars(docCounts.daily.length ? docCounts.daily : buildSeriesFromDates(filterDates(docSnapshots, "daily", { day: docHourlyDate, month: docDailyMonth, year: docMonthlyYear })).daily, 72) : (
                  <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-xs text-muted">문서 데이터가 없습니다.</div>
                ))}
                {docGraphMode === "monthly" && ((docCounts.monthly.length ? docCounts.monthly : buildSeriesFromDates(filterDates(docSnapshots, "monthly", { day: docHourlyDate, month: docDailyMonth, year: docMonthlyYear })).monthly).some((v) => v > 0) ? renderBars(docCounts.monthly.length ? docCounts.monthly : buildSeriesFromDates(filterDates(docSnapshots, "monthly", { day: docHourlyDate, month: docDailyMonth, year: docMonthlyYear })).monthly, 72) : (
                  <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-xs text-muted">문서 데이터가 없습니다.</div>
                ))}
              </div>
              {docGraphMode === "hourly" && renderRangeLabels("hourly", 24)}
              {docGraphMode === "daily" && renderRangeLabels("daily", buildSeriesFromDates(filterDates(docSnapshots, "daily", { day: docHourlyDate, month: docDailyMonth, year: docMonthlyYear })).daily.length)}
              {docGraphMode === "monthly" && renderRangeLabels("monthly", 12)}
            </section>
            <section className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <BookText size={16} /> 문서 지표
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                    <div className="text-muted">페이지</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{docStats.pages}</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                    <div className="text-muted">스냅샷</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{docStats.snapshots}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Clock4 size={16} /> 최근 저장
                </div>
                <div className="mt-3 rounded-lg border border-border/60 bg-panel px-3 py-2 text-xs text-muted">
                  {docStats.lastSaved ? new Date(docStats.lastSaved).toLocaleString("ko-KR") : "최근 저장 기록이 없습니다."}
                </div>
              </div>
            </section>
          </>
        );
      case "calendar":
        return (
          <>
            {renderHeader(
              "Calendar Dashboard",
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent"
                onClick={() => router.push(`${pathname}/calendar`)}
              >
                일정으로 이동 <ArrowUpRight size={12} />
              </button>
            )}
            <section className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><CalendarDays size={16} /> 예정 일정</span>
                  <span className="text-xs text-muted">2주</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{upcomingEvents.length}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Clock4 size={16} /> 이번주</span>
                  <span className="text-xs text-muted">7일</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {upcomingEvents.filter((event) => new Date(event.start) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-panel/70 p-6">
              <div className="flex items-center gap-2 text-sm text-muted">
                <CalendarDays size={16} /> 다가오는 일정
              </div>
              <div className="mt-4 space-y-3">
                {upcomingEvents.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
                    다가오는 일정이 없습니다.
                  </div>
                )}
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-panel px-3 py-2">
                    <div className="rounded-full border border-border/60 bg-panel px-2 py-1 text-[10px] text-muted">
                      {new Date(event.start).toLocaleDateString()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{event.title}</div>
                      <div className="text-[11px] text-muted">
                        {new Date(event.start).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 시작
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-panel/70 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-muted">
                <span className="flex items-center gap-2"><Clock4 size={16} /> 일정 그래프</span>
                <div className="flex flex-col items-end gap-2">
                  {renderGraphFilter(
                    calendarGraphMode,
                    { day: calendarHourlyDate, month: calendarDailyMonth, year: calendarMonthlyYear },
                    (next) => {
                      setCalendarHourlyDate(next.day);
                      setCalendarDailyMonth(next.month);
                      setCalendarMonthlyYear(next.year);
                    }
                  )}
                  {renderGraphTabs(calendarGraphMode, setCalendarGraphMode)}
                </div>
              </div>
              <div className="mt-4">
                {calendarGraphMode === "hourly" && (() => {
                  const fallback = buildSeriesFromDates(
                    filterDates(calendarEvents.map((e) => new Date(e.start).getTime()).filter((ts) => !Number.isNaN(ts)), "hourly", {
                      day: calendarHourlyDate,
                      month: calendarDailyMonth,
                      year: calendarMonthlyYear,
                    })
                  ).hourly;
                  const series = calendarCounts.hourly.length && hasAny(calendarCounts.hourly) ? calendarCounts.hourly : fallback;
                  return hasAny(series) ? renderBars(series, 72) : (
                    <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-xs text-muted">일정 데이터가 없습니다.</div>
                  );
                })()}
                {calendarGraphMode === "daily" && (() => {
                  const fallback = buildSeriesFromDates(
                    filterDates(calendarEvents.map((e) => new Date(e.start).getTime()).filter((ts) => !Number.isNaN(ts)), "daily", {
                      day: calendarHourlyDate,
                      month: calendarDailyMonth,
                      year: calendarMonthlyYear,
                    })
                  ).daily;
                  const series = calendarCounts.daily.length && hasAny(calendarCounts.daily) ? calendarCounts.daily : fallback;
                  return hasAny(series) ? renderBars(series, 72) : (
                    <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-xs text-muted">일정 데이터가 없습니다.</div>
                  );
                })()}
                {calendarGraphMode === "monthly" && (() => {
                  const fallback = buildSeriesFromDates(
                    filterDates(calendarEvents.map((e) => new Date(e.start).getTime()).filter((ts) => !Number.isNaN(ts)), "monthly", {
                      day: calendarHourlyDate,
                      month: calendarDailyMonth,
                      year: calendarMonthlyYear,
                    })
                  ).monthly;
                  const series = calendarCounts.monthly.length && hasAny(calendarCounts.monthly) ? calendarCounts.monthly : fallback;
                  return hasAny(series) ? renderBars(series, 72) : (
                    <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-xs text-muted">일정 데이터가 없습니다.</div>
                  );
                })()}
              </div>
              {calendarGraphMode === "hourly" && renderRangeLabels("hourly", 24)}
              {calendarGraphMode === "daily" && renderRangeLabels("daily", buildSeriesFromDates(filterDates(calendarEvents.map((e) => new Date(e.start).getTime()).filter((ts) => !Number.isNaN(ts)), "daily", { day: calendarHourlyDate, month: calendarDailyMonth, year: calendarMonthlyYear })).daily.length)}
              {calendarGraphMode === "monthly" && renderRangeLabels("monthly", 12)}
            </section>
            <section className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <CalendarDays size={16} /> 일정 요약
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                    <div className="text-muted">이번주</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {upcomingEvents.filter((event) => new Date(event.start) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                    <div className="text-muted">2주 내</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{upcomingEvents.length}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Clock4 size={16} /> 최근 일정
                </div>
                <div className="mt-4 space-y-2">
                  {upcomingEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-panel px-3 py-2 text-xs">
                      <span className="truncate font-semibold text-foreground">{event.title}</span>
                      <span className="text-[11px] text-muted">{new Date(event.start).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {upcomingEvents.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
                      최근 일정이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="flex min-h-full flex-col gap-6 px-4 py-6 md:px-8">
      {view === "overview" ? renderOverview() : renderDetail()}
    </div>
  );
}
