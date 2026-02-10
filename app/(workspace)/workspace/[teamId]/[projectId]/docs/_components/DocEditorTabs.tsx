// app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/DocEditorTabs.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock4, MoreHorizontal, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { getDocMeta } from "../_model/docs";
import {
  DOC_HISTORY_STORAGE_KEY,
  DOC_MAX_HISTORY,
  DOC_TAB_STORAGE_KEY,
} from "../_model/view.constants";
import type { DocTab, HistoryItem } from "../_model/view.types";
import { useDocEditor } from "./DocEditorContext";

export default function DocEditorTabs() {
  const router = useRouter();
  const params = useParams();
  const { docId, meta, status } = useDocEditor();
  const [tabs, setTabs] = useState<DocTab[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const teamId = params?.teamId as string | undefined;
  const projectId = params?.projectId as string | undefined;
  const isSaving = status === "saving";

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedTabs = JSON.parse(
        localStorage.getItem(DOC_TAB_STORAGE_KEY) ?? "[]"
      ) as DocTab[];
      const savedHistory = JSON.parse(
        localStorage.getItem(DOC_HISTORY_STORAGE_KEY) ?? "[]"
      ) as HistoryItem[];
      setTabs(savedTabs);
      setHistory(savedHistory);
    } catch {
      setTabs([]);
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!docId || typeof docId !== "string") return;
    const title = meta?.title ?? getDocMeta(docId)?.title ?? "제목 없음";
    setTabs((prev) => {
      const exists = prev.some((tab) => tab.id === docId);
      let updated: DocTab[];
      if (exists) {
        updated = prev.map((tab) =>
          tab.id === docId && tab.title !== title ? { ...tab, title } : tab
        );
      } else {
        updated = [...prev, { id: docId, title }];
        requestAnimationFrame(() => {
          if (!tabsRef.current) return;
          tabsRef.current.scrollTo({
            left: tabsRef.current.scrollWidth,
            behavior: "smooth",
          });
        });
      }

      persistTabs(updated);

      return updated;
    });
  }, [docId, meta?.title]);

  useEffect(() => {
    if (!historyOpen) return;
    function handleClick(event: MouseEvent) {
      if (!historyRef.current) return;
      if (!historyRef.current.contains(event.target as Node)) {
        setHistoryOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [historyOpen]);

  const navigateTo = (targetId: string) => {
    if (!teamId || !projectId) return;
    router.push(`/workspace/${teamId}/${projectId}/docs/${targetId}`);
  };

  const closeTab = (targetId: string) => {
    setTabs((prev) => {
      const closing = prev.find((tab) => tab.id === targetId);
      const updated = prev.filter((tab) => tab.id !== targetId);
      persistTabs(updated);

      if (closing) {
        setHistory((prevHistory) => {
          const nextHistory = [
            { ...closing, closedAt: new Date().toISOString() },
            ...prevHistory,
          ].slice(0, DOC_MAX_HISTORY);
          persistHistory(nextHistory);
          return nextHistory;
        });
      }

      if (targetId === docId) {
        const fallback = updated[updated.length - 1];
        if (fallback) navigateTo(fallback.id);
        else if (teamId && projectId) {
          router.push(`/workspace/${teamId}/${projectId}/docs`);
        }
      }

      return updated;
    });
  };

  const reopenHistory = (item: HistoryItem) => {
    setHistory((prevHistory) => {
      const filtered = prevHistory.filter((h) => h.id !== item.id);
      persistHistory(filtered);
      return filtered;
    });
    navigateTo(item.id);
    setHistoryOpen(false);
  };

  const currentTabs = useMemo(
    () => tabs.filter((tab) => !!tab.id),
    [tabs]
  );

  return (
    <div className="relative border-b border-border bg-[#e9eef8] px-4 pb-0 pt-3 dark:bg-slate-900">
      <div
        ref={tabsRef}
        className="flex gap-2 overflow-x-auto scrollbar-thin"
      >
        {currentTabs.map((tab) => {
          const active = tab.id === docId;
          return (
            <button
              key={tab.id}
              onClick={() => navigateTo(tab.id)}
              className={`group flex items-center rounded-t-xl border border-border border-b-0 px-4 py-2 text-sm font-medium shadow-sm transition ${
                active
                  ? "bg-white text-foreground dark:bg-slate-800 dark:text-slate-100"
                  : "bg-white/70 text-muted-foreground hover:bg-white hover:text-foreground dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              }`}
            >
              <span
                className={`mr-2 h-2 w-2 rounded-full ${
                  active ? "bg-emerald-400" : "bg-slate-500"
                }`}
              />
              <span className="max-w-[160px] truncate">{tab.title}</span>
              {active && isSaving && (
                <span className="ml-2 h-2 w-2 animate-pulse rounded-full bg-sky-500" />
              )}
              <span className="ml-3 text-muted-foreground transition hover:text-foreground">
                <X size={14} onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} />
              </span>
            </button>
          );
        })}
      </div>

      <div
        ref={historyRef}
        className="absolute right-4 top-2 flex items-center gap-2"
      >
        <button
          type="button"
          className="flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground dark:bg-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
          onClick={() => setHistoryOpen((prev) => !prev)}
        >
          <Clock4 size={14} />
          History
          <MoreHorizontal size={14} />
        </button>
        {historyOpen && (
          <div className="absolute right-0 top-9 z-10 w-64 rounded-xl border border-border bg-white p-3 shadow-xl dark:bg-slate-800">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">
              최근 닫은 문서
            </div>
            {history.length === 0 && (
              <p className="text-xs text-muted-foreground">기록이 없습니다.</p>
            )}
            <div className="max-h-60 overflow-y-auto">
              {history.map((item) => (
                <button
                  key={item.id}
                  className="flex w-full flex-col rounded-md px-2 py-2 text-left text-sm hover:bg-subtle dark:hover:bg-slate-700"
                  onClick={() => reopenHistory(item)}
                >
                  <span className="font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.closedAt).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function persistTabs(tabs: DocTab[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DOC_TAB_STORAGE_KEY, JSON.stringify(tabs));
}

function persistHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DOC_HISTORY_STORAGE_KEY, JSON.stringify(items));
}
