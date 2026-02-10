// app/(workspace)/workspace/[teamId]/[projectId]/dashboard/_components/DashboardView.tsx
'use client';

import { useEffect, useMemo, useState, useCallback, JSX } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  PanelsTopLeft,
  MessageSquare,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  Plus,
  BookText,
  Flame,
  FileText,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

import { useChat } from '@/workspace/chat/_model/store';
import { useWorkspacePath } from '@/hooks/useWorkspacePath';
import type { Channel } from '@/workspace/chat/_model/types';
import type { Issue } from '@/workspace/issues/_model/types';
import { listIssues } from '@/workspace/issues/_service/api';
import Button from '@/components/ui/button';
import {
  DashboardBackgroundSetting,
  DEFAULT_DASHBOARD_BACKGROUND,
  parseDashboardBackground,
  serializeDashboardBackground,
} from '@/lib/dashboardBackground';

export type DashboardProject = {
  id: string;
  name: string;
  color?: string;
  updatedAt?: string;
  summary?: string;
  owner?: string;
  progress?: number;
};

export type DashboardTask = {
  id: string;
  title: string;
  due?: string;
  status?: 'todo' | 'doing' | 'done';
  project?: string;
};

export type DashboardChat = { id: string; title: string; last?: string; date?: string };

export type DashboardEvent = {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  location?: string;
  provider?: string;
};

export type DashboardViewProps = {
  userName?: string;
  backgroundUrl?: string;
  projects?: DashboardProject[];
  tasks?: DashboardTask[];
  chats?: DashboardChat[];
  events?: DashboardEvent[];
};

type DocHighlight = { id: string; title: string; owner: string; updatedAt: string; summary: string };

const BG_KEY = 'dashboard:prefs:bg';
const UPLOADED_BG_KEY = 'dashboard:prefs:uploaded-bg';
const WIDGETS_KEY = 'dashboard:prefs:widgets';

const WIDGET_DEFS = {
  projects: { label: '프로젝트 현황' },
  issues: { label: '이슈 집중' },
  myTasks: { label: '내 작업' },
  chatPulse: { label: '채널 활동' },
  docs: { label: 'Docs 업데이트' },
  calendar: { label: '다가오는 일정' },
} as const;

type WidgetId = keyof typeof WIDGET_DEFS;

type WidgetItem = { id: WidgetId; label: string; visible: boolean };

const DEFAULT_WIDGETS: WidgetItem[] = Object.entries(WIDGET_DEFS).map(([id, value]) => ({
  id: id as WidgetId,
  label: value.label,
  visible: true,
}));

const FALLBACK_PROJECTS: DashboardProject[] = [
  {
    id: 'proj-docs',
    name: 'Docs MVP',
    owner: 'Product Guild',
    summary: 'TipTap 기반 문서 편집기 안정화 및 히스토리 UX 강화',
    color: '#A855F7',
    progress: 68,
    updatedAt: '2025-10-23T09:00:00Z',
  },
  {
    id: 'proj-chat',
    name: 'Chat Realtime',
    owner: 'Realtime Team',
    summary: '채널 Presence와 Thread 경험 개선',
    color: '#38BDF8',
    progress: 54,
    updatedAt: '2025-10-22T15:00:00Z',
  },
  {
    id: 'proj-issues',
    name: 'Issues Automation',
    owner: 'Core Squad',
    summary: 'Kanban Undo/Redo와 GitHub 연동 준비',
    color: '#F97316',
    progress: 42,
    updatedAt: '2025-10-21T11:00:00Z',
  },
];

const FALLBACK_TASKS: DashboardTask[] = [
  {
    id: 'task-1',
    title: 'Docs autosave debounce 조정',
    status: 'doing',
    due: '2025-10-25',
    project: 'Docs MVP',
  },
  {
    id: 'task-2',
    title: 'Issues backlog import',
    status: 'todo',
    due: '2025-10-27',
    project: 'Issues Automation',
  },
  {
    id: 'task-3',
    title: '채널 초대 모달 QA',
    status: 'doing',
    due: '2025-10-26',
    project: 'Chat Realtime',
  },
  {
    id: 'task-4',
    title: '캘린더 Google sync 설계 문서',
    status: 'done',
    due: '2025-10-21',
    project: 'Calendar',
  },
];

const FALLBACK_CHATS: DashboardChat[] = [
  { id: 'channel-product', title: '#product-sync', last: 'Docs Outline 피드백 정리', date: '1시간 전' },
  { id: 'channel-qa', title: '#qa-daily', last: 'Playwright 시나리오 업데이트', date: '3시간 전' },
  { id: 'dm-devb', title: '@ Dev.B', last: 'Issues API 연동 안건', date: '어제' },
];

const FALLBACK_EVENTS: DashboardEvent[] = [
  {
    id: 'event-1',
    title: 'Sprint Review',
    start: new Date(2025, 9, 25, 16, 0),
    end: new Date(2025, 9, 25, 17, 0),
    location: 'Zoom',
  },
  {
    id: 'event-2',
    title: 'Docs UX 워크샵',
    start: new Date(2025, 9, 24, 10, 0),
    end: new Date(2025, 9, 24, 11, 30),
    location: 'Notion Live',
  },
  {
    id: 'event-3',
    title: '팀 헬스체크',
    start: new Date(2025, 9, 23, 9, 30),
    end: new Date(2025, 9, 23, 10, 0),
    location: 'Huddle',
  },
];

const DOC_HIGHLIGHTS: DocHighlight[] = [
  {
    id: 'doc-ops',
    title: 'Flowdash Ops 가이드',
    owner: 'PO',
    updatedAt: '2025-10-23T07:40:00Z',
    summary: '릴리즈 체크리스트와 핸드오버 절차를 최신화했습니다.',
  },
  {
    id: 'doc-ai',
    title: 'AI Summary 플로우',
    owner: 'Dev.C',
    updatedAt: '2025-10-22T13:20:00Z',
    summary: 'Docs ↔ Chat 자동 요약 파이프라인 정의 초안.',
  },
  {
    id: 'doc-kanban',
    title: 'Kanban 히스토리 설계',
    owner: 'Dev.B',
    updatedAt: '2025-10-21T19:10:00Z',
    summary: 'Undo/Redo용 스냅샷 구조 및 보관 전략 정리.',
  },
];

type DocStats = { pages: number; snapshots: number; lastSaved: string };

function sanitizeWidgets(list?: unknown): WidgetItem[] {
  if (!Array.isArray(list)) return DEFAULT_WIDGETS;
  const seen = new Set<WidgetId>();
  const baseMap = new Map(DEFAULT_WIDGETS.map((w) => [w.id, w]));
  const ordered: WidgetItem[] = [];

  list.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const id = (item as { id?: string }).id;
    if (!id || !(id in WIDGET_DEFS)) return;
    const typedId = id as WidgetId;
    if (seen.has(typedId)) return;
    seen.add(typedId);
    const base = baseMap.get(typedId)!;
    ordered.push({
      ...base,
      ...(item as Partial<WidgetItem>),
      id: typedId,
      label: WIDGET_DEFS[typedId].label,
      visible:
        typeof (item as Partial<WidgetItem>).visible === 'boolean'
          ? (item as WidgetItem).visible
          : true,
    });
  });

  DEFAULT_WIDGETS.forEach((def) => {
    if (!seen.has(def.id)) {
      ordered.push({ ...def });
    }
  });

  return ordered;
}

function extractDocStats(): DocStats {
  if (typeof window === 'undefined') return { pages: 0, snapshots: 0, lastSaved: '' };
  try {
    const keys = Object.keys(window.localStorage);
    let pages = 0;
    let snapshots = 0;
    let lastSaved = 0;
    keys.forEach((key) => {
      if (key.startsWith('fd.docs.content:')) pages += 1;
      if (key.startsWith('fd.docs.snapshots:')) {
        const raw = window.localStorage.getItem(key);
        if (!raw) return;
        const parsed = JSON.parse(raw) as { ts?: number }[];
        if (Array.isArray(parsed)) {
          snapshots += parsed.length;
          parsed.forEach((snap) => {
            if (snap?.ts && snap.ts > lastSaved) lastSaved = snap.ts;
          });
        }
      }
    });
    return {
      pages,
      snapshots,
      lastSaved: lastSaved ? new Date(lastSaved).toISOString() : '',
    };
  } catch {
    return { pages: 0, snapshots: 0, lastSaved: '' };
  }
}

function formatRelative(input?: string | number | Date) {
  if (!input) return '기록 없음';
  const date =
    input instanceof Date ? input : typeof input === 'number' ? new Date(input) : new Date(input);
  if (Number.isNaN(date?.getTime())) return '기록 없음';
  return `${formatDistanceToNow(date, { locale: ko })} 전`;
}

function formatDue(due?: string) {
  if (!due) return '마감일 없음';
  const date = new Date(`${due}T00:00:00`);
  if (Number.isNaN(date.getTime())) return due;
  return `${date.getMonth() + 1}월 ${date.getDate()}일 마감`;
}

function formatEventTime(event: DashboardEvent) {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const endFormatter = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const startText = formatter.format(event.start);
  if (!event.end) return startText;
  const sameDay = event.start.toDateString() === event.end.toDateString();
  const endText = sameDay ? endFormatter.format(event.end) : formatter.format(event.end);
  return `${startText} ~ ${endText}`;
}

function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-border bg-background text-foreground shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

function MiniCalendar({ events }: { events: DashboardEvent[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - startDay + 1;
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const date = new Date(year, month, Math.max(1, Math.min(daysInMonth, dayNum)));
    const today =
      inMonth &&
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    const hasEvent =
      inMonth &&
      events.some(
        (event) =>
          event.start.getFullYear() === date.getFullYear() &&
          event.start.getMonth() === date.getMonth() &&
          event.start.getDate() === date.getDate(),
      );
    return (
      <div
        key={i}
        className={clsx(
          'flex h-12 w-12 items-center justify-center rounded-lg text-xs transition',
          'text-muted',
          !inMonth && 'opacity-35',
          hasEvent && !today && 'bg-primary/10 text-primary border border-border',
          today && 'bg-white text-slate-900 font-semibold shadow-lg',
        )}
      >
        {inMonth ? dayNum : ''}
      </div>
    );
  });

  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-foreground/85">
        {year}년 {month + 1}월
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}

export default function DashboardView({
  userName = 'Flowdash 팀',
  backgroundUrl,
  projects = [],
  tasks = [],
  chats = [],
  events = [],
}: DashboardViewProps) {
  const router = useRouter();
  const { buildHref } = useWorkspacePath();
  const [bgSetting, setBgSetting] = useState<DashboardBackgroundSetting | null>(
    backgroundUrl ? { type: 'image', value: backgroundUrl } : DEFAULT_DASHBOARD_BACKGROUND,
  );
  const [uploadedBg, setUploadedBg] = useState<string | undefined>();
  const [widgets, setWidgets] = useState<WidgetItem[]>(DEFAULT_WIDGETS);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState<boolean>(true);
  const [docStats, setDocStats] = useState<DocStats>({ pages: 0, snapshots: 0, lastSaved: '' });

  const projectList = projects.length ? projects : FALLBACK_PROJECTS;
  const taskList = tasks.length ? tasks : FALLBACK_TASKS;
  const chatList = chats.length ? chats : FALLBACK_CHATS;
  const eventList = events.length ? events : FALLBACK_EVENTS;
  const docHighlightList = DOC_HIGHLIGHTS;

  const { channelActivity, channels, setChannel, channelId } = useChat((state) => ({
    channelActivity: state.channelActivity,
    channels: state.channels,
    setChannel: state.setChannel,
    channelId: state.channelId,
  }));

  const channelMap = useMemo(() => {
    const map = new Map<string, Channel>();
    channels.forEach((channel) => map.set(channel.id, channel));
    return map;
  }, [channels]);

  useEffect(() => {
    const apply = () => {
      if (typeof window === 'undefined') return;
      try {
        const storedBg = window.localStorage.getItem(BG_KEY);
        const uploaded = window.localStorage.getItem(UPLOADED_BG_KEY);
        const savedWidgets = window.localStorage.getItem(WIDGETS_KEY);

        const parsedBg = parseDashboardBackground(storedBg);
        if (parsedBg) {
          setBgSetting(parsedBg);
        } else {
          setBgSetting(DEFAULT_DASHBOARD_BACKGROUND);
          window.localStorage.setItem(BG_KEY, serializeDashboardBackground(DEFAULT_DASHBOARD_BACKGROUND));
        }
        if (uploaded) {
          setUploadedBg(uploaded);
        } else if (parsedBg?.type === 'image' && parsedBg.value.startsWith('data:')) {
          setUploadedBg(parsedBg.value);
        } else {
          setUploadedBg(undefined);
        }

        setWidgets(sanitizeWidgets(savedWidgets ? JSON.parse(savedWidgets) : undefined));
      } catch {
        setWidgets(DEFAULT_WIDGETS);
      }
    };

    apply();
    window.addEventListener('dashboard:prefs:changed', apply);
    return () => window.removeEventListener('dashboard:prefs:changed', apply);
  }, []);

  useEffect(() => {
    let active = true;
    listIssues()
      .then((data) => {
        if (!active) return;
        setIssues(data);
      })
      .finally(() => {
        if (active) setIssuesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setDocStats(extractDocStats());
    update();
    window.addEventListener('storage', update);
    window.addEventListener('docs:snapshots:changed', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('docs:snapshots:changed', update);
    };
  }, []);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    setWidgets((prev) => {
      const visible = prev.filter((w) => w.visible);
      const moved = Array.from(visible);
      const [removed] = moved.splice(result.source.index, 1);
      moved.splice(result.destination!.index, 0, removed);

      const merged: WidgetItem[] = [];
      let visibleIndex = 0;
      prev.forEach((item) => {
        if (!item.visible) {
          merged.push(item);
          return;
        }
        merged.push(moved[visibleIndex]);
        visibleIndex += 1;
      });

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(WIDGETS_KEY, JSON.stringify(merged));
      }
      return merged;
    });
  }, []);

  const greet = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침입니다';
    if (hour < 18) return '힘찬 오후입니다';
    return '수고 많았어요';
  }, []);

  const issueStats = useMemo(() => {
    const total = issues.length;
    const done = issues.filter((issue) => issue.status === 'done').length;
    const inProgress = issues.filter((issue) => issue.status === 'in_progress').length;
    const review = issues.filter((issue) => issue.status === 'review').length;
    const backlog = issues.filter(
      (issue) => issue.status === 'todo' || issue.status === 'backlog',
    ).length;
    const urgent = issues.filter((issue) => issue.priority === 'urgent').length;
    const open = Math.max(0, total - done);
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, review, backlog, urgent, open, progress };
  }, [issues]);

  const unreadTotal = useMemo(
    () =>
      Object.values(channelActivity || {}).reduce(
        (sum, activity) => sum + (activity?.unreadCount ?? 0),
        0,
      ),
    [channelActivity],
  );
  const upcomingEvents = useMemo(() => {
    const sorted = [...eventList].sort((a, b) => a.start.getTime() - b.start.getTime());
    return sorted.filter((event) => event.start >= new Date());
  }, [eventList]);

  const topChannels = useMemo(() => {
    const entries = Object.entries(channelActivity || {});
    return entries
      .map(([id, activity]) => ({
        id,
        activity,
        channel: channelMap.get(id),
      }))
      .filter((item) => item.activity)
      .sort(
        (a, b) =>
          (b.activity?.lastMessageTs ?? 0) - (a.activity?.lastMessageTs ?? 0),
      )
      .slice(0, 4);
  }, [channelActivity, channelMap]);

  const metrics = useMemo(() => {
    const docHint = docStats.lastSaved ? `${formatRelative(docStats.lastSaved)} 업데이트` : '최근 저장 없음';
    const chatHint =
      topChannels.length > 0
        ? `${topChannels[0].channel?.name ?? '#채널'} · ${formatRelative(
            topChannels[0].activity?.lastMessageTs,
          )}`
        : '팀이 조용합니다';
    const nextEvent = upcomingEvents[0]?.start;
    const eventHint = nextEvent ? `${formatRelative(nextEvent)} 예정` : '다가오는 일정이 없습니다';

    return [
      {
        id: 'issues',
        label: '열린 이슈',
        value: issueStats.open,
        hint:
          issueStats.urgent > 0
            ? `${issueStats.urgent}건 긴급 · ${issueStats.inProgress}건 진행 중`
            : `${issueStats.inProgress}건 진행 중`,
        icon: FolderKanban,
        iconStyle: 'bg-rose-100 text-rose-700',
      },
      {
        id: 'docs',
        label: 'Docs 페이지',
        value: docStats.pages,
        hint: docHint,
        icon: BookText,
        iconStyle: 'bg-primary/10 text-primary',
      },
      {
        id: 'chat',
        label: '읽지 않은 메시지',
        value: unreadTotal,
        hint: chatHint,
        icon: MessageSquare,
        iconStyle: 'bg-blue-100 text-blue-700',
      },
      {
        id: 'calendar',
        label: '다가오는 일정',
        value: upcomingEvents.length,
        hint: eventHint,
        icon: CalendarDays,
        iconStyle: 'bg-emerald-100 text-emerald-700',
      },
    ];
  }, [docStats, issueStats, unreadTotal, topChannels, upcomingEvents]);

const quickActions: {
    id: string;
    label: string;
    icon: typeof BookText;
    href?: string;
    surface?: string | string[];
    onClick?: () => void;
  }[] = [
    {
      id: 'dashboard-settings',
      label: '대시보드 설정',
      icon: SlidersHorizontal,
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dashboard-settings:open'));
        }
      },
    },
    { id: 'docs', label: 'Docs 작성', icon: BookText, href: '/docs', surface: 'docs' },
    {
      id: 'issue',
      label: '새 이슈',
      icon: FolderKanban,
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('open-new-issue-modal'));
        }
      },
    },
    {
      id: 'chat',
      label: '채널 생성',
      icon: MessageSquare,
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('chat:open-create-channel'));
        }
      },
    },
    {
      id: 'calendar',
      label: '미팅 예약',
      icon: CalendarDays,
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('calendar:open-create-event'));
        }
      },
    },
  ];

  const heroBackground = useMemo<DashboardBackgroundSetting | null>(() => {
    if (uploadedBg) return { type: 'image', value: uploadedBg };
    return bgSetting;
  }, [bgSetting, uploadedBg]);

  const heroSectionStyle = useMemo<CSSProperties | undefined>(() => {
    if (!heroBackground) return undefined;
    if (heroBackground.type === 'color') {
      return {
        background: `linear-gradient(135deg, ${heroBackground.value} 0%, rgba(15,23,42,0.05))`,
      };
    }
    if (heroBackground.type === 'image') {
      return {
        backgroundImage: `linear-gradient(0deg, rgba(9, 30, 66, 0.42), rgba(9, 30, 66, 0.25)), url(${heroBackground.value})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      };
    }
    return undefined;
  }, [heroBackground]);

  const ensureChatDetail = useCallback(
    async (targetId?: string) => {
      const fallback = targetId ?? channelId ?? channels[0]?.id;
      if (!fallback) {
        router.push(buildHref('chat', '/chat'));
        return null;
      }
      await setChannel(fallback);
      const detailPath = buildHref(['chat', encodeURIComponent(fallback)], `/chat/${encodeURIComponent(fallback)}`);
      router.push(detailPath);
      return fallback;
    },
    [buildHref, channelId, channels, router, setChannel],
  );

  const openChannel = useCallback(
    async (id: string) => {
      if (!channelMap.has(id)) {
        router.push(buildHref('chat', '/chat'));
        return;
      }
      await ensureChatDetail(id);
    },
    [buildHref, channelMap, ensureChatDetail, router],
  );

  const handleQuickActionClick = useCallback(
    (actionId: string, handler?: () => void) => {
      if (actionId === 'chat') {
        void (async () => {
          const target = await ensureChatDetail();
          if (target && typeof window !== 'undefined') {
            window.setTimeout(() => window.dispatchEvent(new Event('chat:open-create-channel')), 300);
          }
        })();
        return;
      }
      handler?.();
    },
    [ensureChatDetail],
  );

  const renderWidget = (id: WidgetId): JSX.Element | null => {
    if (id === 'projects') {
      return (
        <GlassCard>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FolderKanban size={16} className="text-primary" />
              프로젝트 현황
            </div>
            <Link href={buildHref('issues', '/issues')} className="text-xs font-medium text-primary transition hover:underline">
              Kanban 열기 →
            </Link>
          </div>
          <div className="space-y-4 p-5">
            {projectList.map((project) => (
              <div
                key={project.id}
                className="rounded-lg border border-border/70 bg-background p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-10 w-10 rounded-md border border-border/60 shadow-sm"
                      style={{ background: project.color ?? '#579DFF' }}
                    />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{project.name}</div>
                      <div className="text-xs text-muted">
                        {project.owner ?? '팀 미지정'} · {formatRelative(project.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-[11px] text-muted">
                    {project.summary ?? '이번 스프린트 목표 정리'}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>진척도</span>
                    <span>{project.progress ?? issueStats.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-primary/80"
                      style={{ width: `${project.progress ?? issueStats.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      );
    }

    if (id === 'issues') {
      const priorityOrder: Record<Issue['priority'], number> = {
        urgent: 0,
        high: 1,
        medium: 2,
        low: 3,
        very_low:4,
      };
      const statusLabel: Record<Issue['status'], string> = {
        backlog: '백로그',
        todo: '할 일',
        in_progress: '진행중',
        review: '리뷰',
        done: '완료',
      };
      const statusStyle: Record<Issue['status'], string> = {
        backlog: 'bg-accent text-muted',
        todo: 'bg-secondary text-secondary-foreground',
        in_progress: 'bg-blue-100 text-blue-700',
        review: 'bg-indigo-100 text-indigo-700',
        done: 'bg-emerald-100 text-emerald-700',
      };
      const priorityStyle: Record<Issue['priority'], string> = {
        very_low: 'border border-emerald-200 bg-sky-50 text-sky-700',
        low: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
        medium: 'border border-amber-200 bg-amber-50 text-amber-700',
        high: 'border border-orange-200 bg-orange-50 text-orange-700',
        urgent: 'border border-rose-200 bg-rose-50 text-rose-700',
      };

      const prioritized = [...issues]
        .sort(
          (a, b) =>
            priorityOrder[a.priority] - priorityOrder[b.priority] ||
            (b.updatedAt > a.updatedAt ? 1 : -1),
        )
        .slice(0, 5);

      return (
        <GlassCard>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Flame size={16} className="text-rose-500" />
              이슈 집중
            </div>
            <div className="text-xs text-muted">
              완료 {issueStats.done}/{issueStats.total} · 진행 {issueStats.inProgress}
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <div className="h-2 rounded-full bg-accent">
                <div
                  className="h-full rounded-full bg-emerald-500/80"
                  style={{ width: `${issueStats.progress}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>전체 {issueStats.total}건</span>
                <span>완료율 {issueStats.progress}%</span>
              </div>
            </div>
            {issuesLoading && (
              <div className="space-y-3 text-sm text-muted">
                <div className="animate-pulse rounded-lg border border-border/60 bg-accent p-4">
                  최근 이슈를 불러오는 중입니다...
                </div>
              </div>
            )}
            {!issuesLoading && prioritized.length === 0 && (
              <div className="rounded-lg border border-border/70 bg-background p-4 text-sm text-muted">
                아직 등록된 이슈가 없습니다. Kanban에서 새로운 작업을 추가해 보세요.
              </div>
            )}
            {!issuesLoading &&
              prioritized.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-lg border border-border/70 bg-background p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className="rounded-md border border-border/60 bg-accent px-2 py-1 font-medium text-muted">
                        {issue.key}
                      </span>
                      <span
                        className={clsx(
                          'rounded-md px-2 py-1 text-[11px] font-medium',
                          statusStyle[issue.status],
                        )}
                      >
                        {statusLabel[issue.status]}
                      </span>
                    </div>
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium',
                        priorityStyle[issue.priority],
                      )}
                    >
                      {issue.priority === 'urgent' && <Flame size={12} />}
                      {issue.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-foreground">{issue.title}</div>
                  <div className="mt-1 text-xs text-muted">
                    {issue.assignee ? `${issue.assignee} 담당` : '담당자 미지정'} ·{' '}
                    {formatRelative(issue.updatedAt)}
                  </div>
                </div>
              ))}
          </div>
        </GlassCard>
      );
    }

    if (id === 'myTasks') {
      const statusLabel: Record<NonNullable<DashboardTask['status']>, string> = {
        todo: '대기',
        doing: '진행중',
        done: '완료',
      };
      const statusStyle: Record<NonNullable<DashboardTask['status']>, string> = {
        todo: 'bg-accent text-muted',
        doing: 'bg-blue-100 text-blue-700',
        done: 'bg-emerald-100 text-emerald-700',
      };

      return (
        <GlassCard>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle2 size={16} className="text-emerald-200" />
              내 작업
            </div>
            <Link href={buildHref('issues', '/issues')} className="text-xs text-muted transition hover:text-foreground">
              전체 보기 →
            </Link>
          </div>
          <div className="space-y-3 p-5">
            {taskList.map((task) => {
              const status = task.status ?? 'todo';
              return (
                <div
                  key={task.id}
                  className="rounded-lg border border-border/70 bg-background p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div
                        className={clsx(
                          'text-sm font-semibold',
                          status === 'done' ? 'text-muted line-through' : 'text-foreground',
                        )}
                      >
                        {task.title}
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {task.project ?? '프로젝트 미지정'}
                      </div>
                    </div>
                    <span
                      className={clsx(
                        'rounded-full px-2.5 py-1 text-[11px] font-medium',
                        statusStyle[status],
                      )}
                    >
                      {statusLabel[status]}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span>{formatDue(task.due)}</span>
                    {status !== 'done' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new Event('open-new-issue-modal'));
                          }
                        }}
                        className="rounded-full border border-border/70 px-2 py-1 text-[11px] text-muted transition hover:border-primary/60 hover:text-primary"
                      >
                        이슈 전환
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      );
    }

    if (id === 'chatPulse') {
      return (
        <GlassCard>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquare size={16} className="text-primary" />
              채널 활동
            </div>
            <Link href={buildHref('chat', '/chat')} className="text-xs text-muted transition hover:text-foreground">
              채팅으로 이동 →
            </Link>
          </div>
          <div className="space-y-3 p-5">
            {topChannels.length === 0 &&
              chatList.map((chat) => (
                <div
                  key={chat.id}
                  className="rounded-lg border border-border/70 bg-background p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{chat.title}</div>
                      <div className="mt-1 text-xs text-muted">{chat.last}</div>
                    </div>
                    <span className="text-[11px] text-muted">{chat.date}</span>
                  </div>
                </div>
              ))}

            {topChannels.map(({ id: channelId, activity, channel }) => (
              <div
                key={channelId}
                className="rounded-lg border border-border/70 bg-background p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {channel?.name ?? channelId}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {activity?.lastPreview ?? '최근 메시지를 요약하는 중입니다.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openChannel(channelId)}
                    className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted transition hover:border-primary/60 hover:text-primary"
                  >
                    열기
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
                  <span>
                    {activity?.lastAuthor ?? '시스템'} · {formatRelative(activity?.lastMessageTs)}
                  </span>
                  {activity?.unreadCount ? (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">
                      미읽기 {activity.unreadCount}
                    </span>
                  ) : null}
                  {activity?.mentionCount ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                      멘션 {activity.mentionCount}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      );
    }

    if (id === 'docs') {
      return (
        <GlassCard>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText size={16} className="text-primary" />
              Docs 업데이트
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => router.push(buildHref('docs', '/docs'))}
            >
              <Plus size={12} />
              새 문서
            </Button>
          </div>
          <div className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-background p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-muted">Docs 페이지</div>
                <div className="mt-3 text-2xl font-semibold text-foreground">
                  {docStats.pages.toLocaleString()}
                </div>
                <div className="mt-2 text-xs text-foreground/55">
                  스냅샷 {docStats.snapshots.toLocaleString()}건 저장됨
                </div>
              </div>
              <div className="rounded-lg border border-border/70 bg-background p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-muted">최근 저장</div>
                <div className="mt-3 text-2xl font-semibold text-foreground">
                  {docStats.lastSaved ? formatRelative(docStats.lastSaved) : '기록 없음'}
                </div>
                <div className="mt-2 text-xs text-foreground/55">
                  Outline · History 패널에서 바로 복구할 수 있어요.
                </div>
              </div>
            </div>
            <ul className="space-y-3">
              {docHighlightList.map((doc) => (
                <li
                  key={doc.id}
                  className="rounded-lg border border-border/70 bg-background p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-foreground">{doc.title}</div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-primary">
                      <Sparkles size={12} />
                      {formatRelative(doc.updatedAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">{doc.summary}</p>
                  <p className="mt-3 text-[11px] text-muted">{doc.owner} 작성</p>
                </li>
              ))}
            </ul>
          </div>
        </GlassCard>
      );
    }

    if (id === 'calendar') {
      return (
        <GlassCard>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarDays size={16} className="text-emerald-500" />
              다가오는 일정
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted hover:text-primary"
              onClick={() => router.push(buildHref('calendar', '/calendar'))}
            >
              캘린더 열기 →
            </Button>
          </div>
          <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <MiniCalendar events={eventList} />
            <div className="space-y-3">
              {upcomingEvents.length === 0 && (
                <div className="rounded-lg border border-border/70 bg-background p-4 text-sm text-muted">
                  예정된 일정이 없습니다. Google Calendar와 연동해 보세요.
                </div>
              )}
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-border/70 bg-background p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-foreground">{event.title}</div>
                    <span className="text-[11px] text-muted">{event.provider ?? 'internal'}</span>
                  </div>
                  <div className="mt-2 text-xs text-muted">{formatEventTime(event)}</div>
                  {event.location && (
                    <div className="mt-1 text-[11px] text-muted">{event.location}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      );
    }

    return null;
  };

  const visibleWidgets = widgets.filter((widget) => widget.visible);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-5 px-3 py-6 lg:px-7">
        <section
          className={clsx(
            'relative overflow-hidden rounded-3xl border border-border shadow-sm',
            heroBackground ? 'bg-transparent' : 'bg-panel',
          )}
          style={heroSectionStyle}
        >
          {heroBackground?.type === 'iframe' && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <iframe
                src={heroBackground.value}
                title="Dashboard background video"
                className="h-full w-full scale-110 transform-gpu border-0 object-cover opacity-60"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-transparent" />
            </div>
          )}
          <div className="relative z-10 flex flex-col gap-5 bg-panel px-5 py-6 shadow-inner">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/20 px-3 py-1 text-xs font-semibold text-secondary">
                <PanelsTopLeft size={16} />
                워크스페이스 허브
              </div>
              <h1 className="text-3xl font-semibold text-foreground sm:text-[34px]">
                {userName}님, {greet}!
              </h1>
              <p className="max-w-2xl text-sm text-muted sm:text-base">
                Docs · Chat · Issues · Calendar의 핵심 정보를 한눈에 확인하고 필요한 작업으로 바로 이동하세요.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                if (action.href) {
                  const href =
                    action.surface && action.surface.length
                      ? buildHref(action.surface, action.href)
                      : action.href;
                  return (
                    <Button key={action.id} asChild variant="outline" size="sm" className="gap-2">
                      <Link href={href}>
                        <Icon size={14} />
                        {action.label}
                      </Link>
                    </Button>
                  );
                }
                return (
                  <Button
                    key={action.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleQuickActionClick(action.id, action.onClick)}
                  >
                    <Icon size={14} />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </section><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.id}
                className="rounded-xl border border-border bg-background p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                      {metric.label}
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-foreground">
                      {metric.value.toLocaleString()}
                    </div>
                  </div>
                  <span className={clsx('rounded-full p-2 shadow-sm', metric.iconStyle)}>
                    <Icon size={18} />
                  </span>
                </div>
                <p className="mt-4 text-xs text-muted">{metric.hint}</p>
              </div>
            );
          })}
        </section>

        <section className="pb-12">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="dashboard-widgets">
              {(dropProvided) => (
                <div
                  ref={dropProvided.innerRef}
                  {...dropProvided.droppableProps}
                  className="grid grid-cols-1 gap-6 xl:grid-cols-2"
                >
                  {visibleWidgets.map((widget, index) => {
                    const node = renderWidget(widget.id);
                    if (!node) return null;
                    return (
                      <Draggable key={widget.id} draggableId={widget.id} index={index}>
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing"
                          >
                            {node}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {dropProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </section>
      </div>
    </div>
  );
}



