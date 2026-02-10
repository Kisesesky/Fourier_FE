// components/layout/sidebar/CalendarPanel.tsx
'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  Pencil,
  Settings,
  Trash2,
} from "lucide-react";

import type { ProjectCalendar } from "@/workspace/calendar/_model/types";
import DeleteConfirmModal from "@/app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/note-drive/tree/DeleteConfirmModal";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import {
  createCalendarFolder,
  deleteCalendarFolder,
  deleteProjectCalendar,
  getCalendarEvents,
  getCalendarFolders,
  getProjectCalendars,
  updateCalendarFolder,
  updateProjectCalendar,
} from "@/workspace/calendar/_service/api";

export default function CalendarPanel() {
  const { projectId } = useParams<{ projectId: string }>();
  const [calendars, setCalendars] = useState<ProjectCalendar[]>([]);
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [upcomingCounts, setUpcomingCounts] = useState<Record<string, number>>({});
  const [openRoot, setOpenRoot] = useState(true);
  const [openPersonal, setOpenPersonal] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    target: { type: "folder" | "calendar"; id: string; name: string; calendarType?: ProjectCalendar["type"] };
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "folder" | "calendar"; id: string; name: string } | null>(null);
  const [deleteCalendarTarget, setDeleteCalendarTarget] = useState<ProjectCalendar | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { buildHref } = useWorkspacePath();
  const router = useRouter();

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    const load = async () => {
      try {
        const [calendarData, folderData] = await Promise.all([
          getProjectCalendars(projectId),
          getCalendarFolders(projectId),
        ]);
        if (!mounted) return;
        setCalendars(calendarData ?? []);
        setFolders(folderData ?? []);
        const now = Date.now();
        const counts: Record<string, number> = {};
        const calendarsToCount = calendarData ?? [];
        const eventBatches = await Promise.all(
          calendarsToCount.map((calendar) =>
            getCalendarEvents({ projectId, calendarId: calendar.id }),
          ),
        );
        eventBatches.forEach((batch, index) => {
          const calendarId = calendarsToCount[index]?.id;
          if (!calendarId) return;
          (batch?.events ?? []).forEach((event) => {
            const start = new Date(event.start).getTime();
            if (Number.isNaN(start) || start < now) return;
            counts[calendarId] = (counts[calendarId] ?? 0) + 1;
          });
        });
        setUpcomingCounts(counts);
      } catch {
        if (!mounted) return;
        setCalendars([]);
        setFolders([]);
        setUpcomingCounts({});
      }
    };
    load();
    const handler = () => load();
    window.addEventListener("calendar:categories:changed", handler);
    return () => {
      mounted = false;
      window.removeEventListener("calendar:categories:changed", handler);
    };
  }, [projectId]);

  useEffect(() => {
    if (!contextMenu) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContextMenu(null);
    };
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) setContextMenu(null);
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("mousedown", handleClick);
    };
  }, [contextMenu]);

  const openCalendarCreate = () => {
    if (!projectId) return;
    const target = buildHref("calendar", "/calendar");
    router.push(target);
    setTimeout(() => {
      window.dispatchEvent(new Event("calendar:open-create"));
    }, 0);
  };

  const openCalendarManage = (calendar: ProjectCalendar) => {
    if (!projectId) return;
    const target = buildHref("calendar", "/calendar");
    router.push(target);
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("calendar:open-manage", {
          detail: { id: calendar.id, name: calendar.name, color: calendar.color },
        })
      );
    }, 0);
  };

  const handleCreateFolder = () => {
    setFolderModalOpen(true);
    setFolderName("");
  };

  const submitCreateFolder = async () => {
    if (!projectId) return;
    const name = folderName.trim();
    if (!name) return;
    try {
      const created = await createCalendarFolder(projectId, { name });
      setFolders((prev) => [...prev, { id: created.id, name: created.name }]);
      setOpenGroups((prev) => ({ ...prev, [created.id]: true }));
      setFolderModalOpen(false);
      setFolderName("");
    } catch {
      return;
    }
  };

  const handleDeleteCalendar = async (calendar: ProjectCalendar) => {
    if (!projectId) return;
    setDeleteCalendarTarget(calendar);
  };

  const confirmDeleteCalendar = async () => {
    if (!projectId || !deleteCalendarTarget) return;
    try {
      await deleteProjectCalendar(projectId, deleteCalendarTarget.id);
      setCalendars((prev) => prev.filter((item) => item.id !== deleteCalendarTarget.id));
      window.dispatchEvent(new Event("calendar:categories:changed"));
    } catch {
      return;
    } finally {
      setDeleteCalendarTarget(null);
    }
  };

  const handleDropCalendar = async (folderId: string | null, event: React.DragEvent) => {
    event.preventDefault();
    const calendarId =
      event.dataTransfer.getData("application/x-calendar-id") ||
      event.dataTransfer.getData("text/plain");
    if (!calendarId || !projectId) return;
    try {
      await updateProjectCalendar(projectId, calendarId, { folderId: folderId ?? null });
      window.dispatchEvent(new Event("calendar:categories:changed"));
    } catch {
      return;
    }
  };

  const personalCalendars = useMemo(
    () => calendars.filter((cal) => cal.type === "PERSONAL"),
    [calendars],
  );

  const sharedCalendars = useMemo(
    () => calendars.filter((cal) => cal.type !== "PERSONAL"),
    [calendars],
  );

  const folderedCalendars = useMemo(() => {
    const map = new Map<string, ProjectCalendar[]>();
    folders.forEach((folder) => map.set(folder.id, []));
    const uncategorized: ProjectCalendar[] = [];
    sharedCalendars.forEach((cal) => {
      const folderId = cal.folderId;
      if (folderId && map.has(folderId)) {
        map.get(folderId)!.push(cal);
      } else {
        uncategorized.push(cal);
      }
    });
    if (uncategorized.length > 0) {
      map.set("uncategorized", uncategorized);
    }
    return map;
  }, [folders, sharedCalendars]);

  const renderCalendarRow = (cal: ProjectCalendar, depth = 1) => (
    <div
      key={cal.id}
      className="group flex h-9 w-full items-center rounded-md px-2 text-[11px] text-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
      style={{ paddingLeft: depth * 14 + 8 }}
      onContextMenu={
        cal.type === "PERSONAL"
          ? undefined
          : (event) => {
              event.preventDefault();
              setContextMenu({
                x: event.clientX,
                y: event.clientY,
                target: { type: "calendar", id: cal.id, name: cal.name, calendarType: cal.type },
              });
            }
      }
      draggable={cal.type !== "PERSONAL"}
      onDragStart={(event) => {
        if (cal.type === "PERSONAL") return;
        event.dataTransfer.setData("application/x-calendar-id", cal.id);
        event.dataTransfer.setData("text/plain", cal.id);
        event.dataTransfer.effectAllowed = "move";
      }}
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-md"
        style={{ color: cal.color }}
      >
        <CalendarDays size={14} />
      </span>
      <button
        type="button"
        onClick={() => router.push(buildHref(["calendar", cal.id], `/calendar/${cal.id}`))}
        className="flex flex-1 items-center gap-2 text-left"
      >
        <span className="truncate" style={{ color: cal.color }}>{cal.name}</span>
      </button>
      <div className="ml-auto flex items-center gap-1">
        {cal.type !== "PERSONAL" && (
          <>
            <button
              type="button"
              onClick={() => openCalendarManage(cal)}
              className="rounded-md p-1 text-muted opacity-0 transition hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
              aria-label="캘린더 관리"
            >
              <Settings size={12} />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteCalendar(cal)}
              className="rounded-md p-1 text-rose-500/80 opacity-0 transition hover:text-rose-500 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
              aria-label="캘린더 삭제"
            >
              <Trash2 size={12} />
            </button>
          </>
        )}
        {upcomingCounts[cal.id] ? (
          <span className="rounded-md bg-gray-400 px-2.5 py-0.5 text-[10px] font-bold text-white transition group-hover:opacity-0">
            {upcomingCounts[cal.id]}
          </span>
        ) : null}
      </div>
    </div>
  );

  const renderFolder = (folder: { id: string; name: string }) => {
    const items = folderedCalendars.get(folder.id) ?? [];
    const open = openGroups[folder.id] ?? true;
    return (
      <div
        key={folder.id}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          if (folder.id === "uncategorized") {
            handleDropCalendar(null, event);
          } else {
            handleDropCalendar(folder.id, event);
          }
        }}
      >
        <button
          type="button"
          onClick={() => setOpenGroups((prev) => ({ ...prev, [folder.id]: !open }))}
          className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] font-medium text-muted-500 transition hover:bg-sidebar-accent hover:text-sky-600"
          style={{ paddingLeft: 22 }}
          onContextMenu={
            folder.id === "uncategorized"
              ? undefined
              : (event) => {
                  event.preventDefault();
                  setContextMenu({
                    x: event.clientX,
                    y: event.clientY,
                    target: { type: "folder", id: folder.id, name: folder.name },
                  });
                }
          }
        >
          {open ? <ChevronDown size={16} className="text-muted" /> : <ChevronRight size={16} className="text-muted" />}
          <Folder size={16} className="text-sky-500" />
          <span className="truncate">{folder.name}</span>
        </button>
        {open && <div className="mt-[2px] space-y-[2px]">{items.map((cal) => renderCalendarRow(cal, 3))}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCreateFolder}
            className="inline-flex items-center justify-center rounded-md border border-border/60 bg-transparent p-1 text-muted transition hover:border-border hover:text-foreground"
            aria-label="폴더 추가"
          >
            <FolderPlus size={16} />
          </button>
          <button
            type="button"
            onClick={openCalendarCreate}
            className="inline-flex items-center justify-center rounded-md border border-border/60 bg-transparent p-1 text-muted transition hover:border-border hover:text-foreground"
            aria-label="캘린더 추가"
          >
            <CalendarPlus size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setOpenRoot((prev) => !prev)}
              className="flex h-9 flex-1 items-center gap-2 rounded-md px-2 text-left text-[12px] font-medium text-muted transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDropCalendar(null, event)}
            >
              {openRoot ? <ChevronDown size={16} className="text-muted" /> : <ChevronRight size={16} className="text-muted" />}
              <Folder size={18} className="text-amber-400" />
              <span className="truncate">캘린더 트리</span>
            </button>
            <button
              type="button"
              onClick={() => router.push(buildHref("calendar", "/calendar"))}
              className="rounded-md px-2 py-1 text-xs text-muted transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              전체 보기
            </button>
          </div>
          {openRoot && (
            <div className="mt-[2px] space-y-[2px]">
              <div className="mt-[2px] space-y-[2px]">
                {folders.map(renderFolder)}
                {folderedCalendars.has("uncategorized") && renderFolder({ id: "uncategorized", name: "분류 없음" })}
                {sharedCalendars.length === 0 && (
                  <div className="ml-6 rounded-md px-2 py-1 text-xs text-muted">
                    캘린더가 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="my-2 border-t border-border/60" />

        <div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setOpenPersonal((prev) => !prev)}
              className="flex h-9 flex-1 items-center gap-2 rounded-md px-2 text-left text-[12px] font-medium text-muted transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              {openPersonal ? <ChevronDown size={16} className="text-muted" /> : <ChevronRight size={16} className="text-muted" />}
              <Folder size={18} className="text-lime-500" />
              <span className="truncate">
                개인 캘린더
              </span>
            </button>
          </div>
          {openPersonal && (
            <div className="mt-[2px] space-y-[2px]">
              {personalCalendars.length > 0 ? (
                personalCalendars.map((cal) => renderCalendarRow(cal, 2))
              ) : (
                <div className="ml-6 rounded-md px-2 py-1 text-xs text-muted">
                  캘린더가 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed w-40 rounded-md border border-border bg-panel text-sm text-foreground shadow-lg py-1"
          style={{ top: contextMenu.y, left: contextMenu.x, zIndex: 999 }}
        >
          {contextMenu.target.type === "folder" && contextMenu.target.id !== "uncategorized" && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-sidebar-accent"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("calendar:open-create", {
                    detail: { folderId: contextMenu.target.id },
                  }),
                );
                setContextMenu(null);
              }}
            >
              <CalendarPlus size={15} />
              캘린더 추가
            </button>
          )}
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-sidebar-accent"
            onClick={async () => {
              const value = window.prompt("새 이름을 입력하세요");
              if (!value || !projectId) return;
              try {
                if (contextMenu.target.type === "folder") {
                  await updateCalendarFolder(projectId, contextMenu.target.id, { name: value });
                } else {
                  await updateProjectCalendar(projectId, contextMenu.target.id, { name: value });
                }
                window.dispatchEvent(new Event("calendar:categories:changed"));
              } finally {
                setContextMenu(null);
              }
            }}
          >
            <Pencil size={15} />
            이름 변경
          </button>

          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-rose-500 hover:bg-sidebar-accent"
            onClick={() => {
              setDeleteTarget({ type: contextMenu.target.type, id: contextMenu.target.id, name: contextMenu.target.name });
              setContextMenu(null);
            }}
          >
            <Trash2 size={15} />
            삭제
          </button>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteTarget}
        title={deleteTarget?.type === "folder" ? "폴더 삭제" : "캘린더 삭제"}
        description={
          deleteTarget?.type === "folder"
            ? "이 폴더와 내부 모든 캘린더를 삭제하시겠습니까?"
            : "이 캘린더를 삭제하시겠습니까?"
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget || !projectId) return;
          try {
            if (deleteTarget.type === "folder") {
              await deleteCalendarFolder(projectId, deleteTarget.id);
            } else {
              await deleteProjectCalendar(projectId, deleteTarget.id);
            }
            window.dispatchEvent(new Event("calendar:categories:changed"));
          } finally {
            setDeleteTarget(null);
          }
        }}
      />

      <DeleteConfirmModal
        open={!!deleteCalendarTarget}
        title="캘린더 삭제"
        description={`캘린더 "${deleteCalendarTarget?.name ?? ""}" 를 삭제하시겠습니까?`}
        onCancel={() => setDeleteCalendarTarget(null)}
        onConfirm={confirmDeleteCalendar}
      />

      {folderModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-[360px] rounded-2xl border border-border bg-panel p-5 text-foreground shadow-xl space-y-4 animate-fadeIn">
            <h3 className="font-semibold text-base">새 폴더 만들기</h3>

            <div>
              <p className="text-xs text-muted">이름</p>
              <input
                className="w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground"
                placeholder="이름 입력"
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="h-9 min-w-[88px] rounded-lg border border-border px-4 text-sm font-semibold text-muted hover:bg-sidebar-accent hover:text-foreground"
                onClick={() => setFolderModalOpen(false)}
              >
                취소
              </button>

              <button
                className="h-9 min-w-[88px] rounded-lg bg-foreground px-4 text-sm font-semibold text-background hover:opacity-90"
                onClick={submitCreateFolder}
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
