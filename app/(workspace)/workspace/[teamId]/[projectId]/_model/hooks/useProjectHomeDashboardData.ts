// app/(workspace)/workspace/[teamId]/[projectId]/_model/hooks/useProjectHomeDashboardData.ts

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchProjectMembers, getProjectMemberAnalytics } from "@/lib/projects";
import { getCalendarAnalytics, getCalendarEvents, getProjectCalendars } from "@/workspace/calendar/_service/api";
import { useChat } from "@/workspace/chat/_model/store";
import { getMessageAnalytics, listMessages } from "@/workspace/chat/_service/api";
import { getDocsAnalytics, listDocuments } from "@/workspace/docs/_service/api";
import { listProjectFiles } from "@/workspace/file/_service/api";
import { getIssueAnalytics, listIssues } from "@/workspace/issues/_service/api";
import type { CalendarEvent } from "@/workspace/calendar/_model/types";
import type { Issue } from "@/workspace/issues/_model/types";
import { createEmptyAnalyticsCounts, createEmptyIssueStats } from "../dashboard-page.constants";
import { parseProjectMembers, parseRecentDocs, parseRecentFiles } from "../schemas/home-dashboard.schemas";
import type { ProjectCalendar } from "@/workspace/calendar/_model/types";

type UseProjectHomeDashboardDataParams = {
  teamId: string;
  projectId: string;
  messageHourlyDate: string;
  messageDailyMonth: string;
  messageMonthlyYear: string;
  issueHourlyDate: string;
  issueDailyMonth: string;
  issueMonthlyYear: string;
  memberHourlyDate: string;
  memberDailyMonth: string;
  memberMonthlyYear: string;
  docHourlyDate: string;
  docDailyMonth: string;
  docMonthlyYear: string;
  calendarHourlyDate: string;
  calendarDailyMonth: string;
  calendarMonthlyYear: string;
};

export function useProjectHomeDashboardData({
  teamId,
  projectId,
  messageHourlyDate,
  messageDailyMonth,
  messageMonthlyYear,
  issueHourlyDate,
  issueDailyMonth,
  issueMonthlyYear,
  memberHourlyDate,
  memberDailyMonth,
  memberMonthlyYear,
  docHourlyDate,
  docDailyMonth,
  docMonthlyYear,
  calendarHourlyDate,
  calendarDailyMonth,
  calendarMonthlyYear,
}: UseProjectHomeDashboardDataParams) {
  const { channels, channelActivity, loadChannels, setContext, users, me } = useChat();

  const [memberCount, setMemberCount] = useState(0);
  const [members, setMembers] = useState<Array<{ id: string; name: string; displayName?: string; avatarUrl?: string | null; role?: string; joinedAt?: number }>>([]);
  const [issueCount, setIssueCount] = useState(0);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issueStats, setIssueStats] = useState(createEmptyIssueStats);
  const [docStats, setDocStats] = useState({ pages: 0, snapshots: 0, lastSaved: "" });
  const [docSnapshots, setDocSnapshots] = useState<number[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarSources, setCalendarSources] = useState<ProjectCalendar[]>([]);
  const [fileCount, setFileCount] = useState(0);
  const [fileTotalBytes, setFileTotalBytes] = useState(0);
  const [recentFiles, setRecentFiles] = useState<Array<{ id: string; name: string; createdAt: string; size: number }>>([]);
  const [recentDocs, setRecentDocs] = useState<Array<{ id: string; title: string; createdAt: string; updatedAt: string; folderId?: string | null; authorName?: string | null; authorAvatarUrl?: string | null }>>([]);
  const [chatStats, setChatStats] = useState({
    messageCount: 0,
    channelCount: 0,
    dmCount: 0,
    threadRootCount: 0,
    threadReplyCount: 0,
  });
  const [chatThreadRows, setChatThreadRows] = useState<Array<{ channelId: string; channelName: string; threadCount: number }>>([]);
  const [messageDates, setMessageDates] = useState<number[]>([]);
  const [messageCounts, setMessageCounts] = useState(createEmptyAnalyticsCounts);
  const [issueCounts, setIssueCounts] = useState(createEmptyAnalyticsCounts);
  const [memberCounts, setMemberCounts] = useState(createEmptyAnalyticsCounts);
  const [docCounts, setDocCounts] = useState(createEmptyAnalyticsCounts);
  const [calendarCounts, setCalendarCounts] = useState(createEmptyAnalyticsCounts);

  const analyticsCacheRef = useRef<Map<string, { counts: number[]; granularity: string }>>(new Map());

  const issuesByStatus = useMemo(
    () => ({
      backlog: issues.filter((item) => item.status === "backlog"),
      todo: issues.filter((item) => item.status === "todo"),
      in_progress: issues.filter((item) => item.status === "in_progress"),
      review: issues.filter((item) => item.status === "review"),
      done: issues.filter((item) => item.status === "done"),
    }),
    [issues],
  );

  const calendarBuckets = useMemo(() => {
    const calendarMap = new Map(calendarSources.map((calendar) => [calendar.id, calendar]));
    const map = new Map<string, { key: string; name: string; count: number; color: string }>();
    calendarEvents.forEach((event) => {
      const key = event.calendarId || event.categoryId || "unknown";
      const source = key ? calendarMap.get(key) : undefined;
      const name = source?.name || event.categoryName || "기본 캘린더";
      const color = source?.color || event.categoryColor || "#3b82f6";
      const prev = map.get(key);
      if (prev) prev.count += 1;
      else map.set(key, { key, name, color, count: 1 });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [calendarEvents, calendarSources]);

  const calendarCategoryBuckets = useMemo(() => {
    const map = new Map<string, { key: string; name: string; count: number; color: string }>();
    calendarEvents.forEach((event) => {
      const key = event.categoryId || "default";
      const prev = map.get(key);
      if (prev) {
        prev.count += 1;
        return;
      }
      map.set(key, {
        key,
        name: event.categoryName || "기본",
        color: event.categoryColor || "#3b82f6",
        count: 1,
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [calendarEvents]);

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
        const list = parseProjectMembers(data);
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
        setIssueStats(createEmptyIssueStats());
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
    let active = true;
    listDocuments(projectId)
      .then((list) => {
        if (!active) return;
        const rows = parseRecentDocs(list)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 8);
        setRecentDocs(rows);
      })
      .catch(() => {
        if (!active) return;
        setRecentDocs([]);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    getProjectCalendars(projectId)
      .then((list) => {
        if (!active) return;
        setCalendarSources(list ?? []);
      })
      .catch(() => {
        if (!active) return;
        setCalendarSources([]);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

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
    let active = true;
    listProjectFiles(projectId)
      .then((files) => {
        if (!active) return;
        const normalized = parseRecentFiles(files);
        setFileCount(normalized.length);
        setFileTotalBytes(normalized.reduce((sum, item) => sum + item.size, 0));
        setRecentFiles(
          normalized
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5),
        );
      })
      .catch(() => {
        if (!active) return;
        setFileCount(0);
        setFileTotalBytes(0);
        setRecentFiles([]);
      });
    return () => {
      active = false;
    };
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
    if (!channels.length) {
      setChatStats({
        messageCount: 0,
        channelCount: 0,
        dmCount: 0,
        threadRootCount: 0,
        threadReplyCount: 0,
      });
      setChatThreadRows([]);
      return;
    }
    let mounted = true;
    const loadMessageDates = async () => {
      try {
        const results = await Promise.allSettled(
          channels.map(async (channel) => {
            const list = await listMessages(channel.id);
            return {
              channelId: channel.id,
              channelName: channel.name,
              messages: list,
              dates: list.map((msg) => new Date(msg.createdAt).getTime()).filter((ts) => !Number.isNaN(ts)),
            };
          })
        );
        const fulfilled = results
          .filter((res): res is PromiseFulfilledResult<{ channelId: string; channelName: string; messages: Awaited<ReturnType<typeof listMessages>>; dates: number[] }> => res.status === "fulfilled")
          .map((res) => res.value);
        const merged = fulfilled.flatMap((row) => row.dates);
        const messageCount = fulfilled.reduce((sum, row) => sum + row.messages.length, 0);
        const threadReplyCount = fulfilled.reduce(
          (sum, row) => sum + row.messages.filter((msg) => Boolean(msg.threadParentId)).length,
          0,
        );
        const threadRootCount = fulfilled.reduce(
          (sum, row) =>
            sum +
            row.messages.filter(
              (msg) => !msg.threadParentId && ((msg.thread?.count ?? 0) > 0),
            ).length,
          0,
        );
        const threadRows = fulfilled
          .map((row) => {
            const replyCount = row.messages.filter((msg) => Boolean(msg.threadParentId)).length;
            const rootCount = row.messages.filter((msg) => !msg.threadParentId && ((msg.thread?.count ?? 0) > 0)).length;
            return {
              channelId: row.channelId,
              channelName: row.channelName,
              threadCount: Math.max(replyCount, rootCount),
            };
          })
          .filter((row) => row.threadCount > 0)
          .sort((a, b) => b.threadCount - a.threadCount)
          .slice(0, 8);
        if (mounted) {
          setMessageDates(merged);
          const dmCount = channels.filter((channel) => channel.id.startsWith("dm:")).length;
          setChatStats({
            messageCount,
            channelCount: channels.length - dmCount,
            dmCount,
            threadRootCount,
            threadReplyCount,
          });
          setChatThreadRows(threadRows);
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

  return {
    channels,
    channelActivity,
    chatUsers: users,
    currentUserId: me.id,
    memberCount,
    members,
    issueCount,
    issues,
    issueStats,
    docStats,
    docSnapshots,
    upcomingEvents,
    calendarEvents,
    fileCount,
    fileTotalBytes,
    recentFiles,
    recentDocs,
    chatStats,
    chatThreadRows,
    messageDates,
    messageCounts,
    issueCounts,
    memberCounts,
    docCounts,
    calendarCounts,
    issuesByStatus,
    calendarBuckets,
    calendarCategoryBuckets,
    calendarSources,
  };
}
