"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List as ListIcon, FileText } from "lucide-react";
import Image from "next/image";

import {
  getDocs,
  getFolders,
  createDoc,
  createFolder,
  deleteDoc,
  deleteFolder,
  renameDoc,
  renameFolder,
  moveDocToFolder,
  setDocStarred,
  syncDocsFromServer,
} from "@/workspace/docs/_model/docs";

import { subscribeDocsEvent } from "@/workspace/docs/_model/events";
import { DocumentGrid } from "@/workspace/docs/_components/note-drive/DocumentGrid";
import { DocumentTable, type SortKey } from "@/workspace/docs/_components/note-drive/DocumentTable";
import { FolderGrid } from "@/workspace/docs/_components/note-drive/FolderGrid";
import { SortMenu } from "@/workspace/docs/_components/note-drive/SortMenu";
import { CreateFolderModal } from "@/workspace/docs/_components/note-drive/CreateFolderModal";
import { DocMeta, DocFolder } from "@/workspace/docs/_model/types";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import {
  createDocumentComment,
  listDocumentComments,
  type DocumentCommentDto,
} from "@/workspace/docs/_service/api";
import { docToMarkdown, renderMarkdownToHtml } from "../_model/markdown";

type FilterKey = "all" | "starred" | "shared" | "recent";

export default function DocsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { buildHref } = useWorkspacePath();
  const readAllMode = searchParams?.get("read") === "all";

  /* STATE */
  const [docs, setDocs] = useState<DocMeta[]>(() => getDocs());
  const [folders, setFolders] = useState<DocFolder[]>(() => getFolders());
  const [activeFolder, setActiveFolder] = useState<"all" | "unfiled" | string>("all");

  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [commentsByDoc, setCommentsByDoc] = useState<Record<string, DocumentCommentDto[]>>({});
  const [commentCountByDoc, setCommentCountByDoc] = useState<Record<string, number>>({});
  const [openCommentsByDoc, setOpenCommentsByDoc] = useState<Record<string, boolean>>({});
  const [visibleCommentsByDoc, setVisibleCommentsByDoc] = useState<Record<string, number>>({});
  const [loadingCommentsByDoc, setLoadingCommentsByDoc] = useState<Record<string, boolean>>({});
  const [draftByDoc, setDraftByDoc] = useState<Record<string, string>>({});
  const [savingByDoc, setSavingByDoc] = useState<Record<string, boolean>>({});

  /* SYNC EVENTS -------------------------------------------------- */
  useEffect(() => {
    void syncDocsFromServer()
      .then(() => {
        setDocs(getDocs());
        setFolders(getFolders());
      })
      .catch(() => {});

    const unsub = subscribeDocsEvent(() => {
      setDocs(getDocs());
      setFolders(getFolders());
    });
    return () => unsub();
  }, []);

  /* FOLDER SANITY CHECK */
  useEffect(() => {
    if (activeFolder === "all" || activeFolder === "unfiled") return;
    if (!folders.some((f) => f.id === activeFolder)) {
      setActiveFolder("all");
    }
  }, [activeFolder, folders]);

  /* HELPERS ------------------------------------------------------ */
  const folderMap = useMemo(() => {
    const map = new Map<string, DocFolder>();
    folders.forEach((f) => map.set(f.id, f));
    return map;
  }, [folders]);

  const resolvePrimaryLocation = (doc: DocMeta) => {
    return doc.locations?.[0] ?? null;
  };

  const docsInFolder = useMemo(() => {
    if (activeFolder === "all") return docs;
    if (activeFolder === "unfiled") return docs.filter((d) => d.locations.length === 0);
    return docs.filter((d) => d.locations.includes(activeFolder));
  }, [docs, activeFolder]);

  /* CRUD --------------------------------------------------------- */
  const handleCreateDoc = async () => {
    const primary = activeFolder === "all" ? undefined : activeFolder;
    const newDoc = await createDoc("새 문서", primary);
    setDocs(getDocs());
    router.push(buildHref(["docs", newDoc.id], `/docs/${newDoc.id}`));
  };

  const handleDuplicate = async (doc: DocMeta) => {
    await createDoc(`${doc.title} 복제본`, resolvePrimaryLocation(doc), {
      icon: doc.icon,
      color: doc.color,
    });
    setDocs(getDocs());
  };

  const handleRename = async (doc: DocMeta) => {
    const name = prompt("문서 이름을 입력하세요", doc.title);
    if (!name?.trim()) return;
    await renameDoc(doc.id, name.trim());
    setDocs(getDocs());
  };

  const handleToggleStar = async (doc: DocMeta) => {
    await setDocStarred(doc.id, !doc.starred);
    setDocs(getDocs());
  };

  const handleDelete = async (doc: DocMeta) => {
    if (!confirm(`"${doc.title}"을 삭제할까요?`)) return;
    await deleteDoc(doc.id);
    setDocs(getDocs());
  };

  const handleCreateFolder = async (name: string) => {
    await createFolder(name);
    setFolders(getFolders());
    setFolderModalOpen(false);
  };

  const handleRenameFolder = async (folder: DocFolder) => {
    const name = prompt("폴더 이름 입력", folder.name);
    if (!name?.trim()) return;
    await renameFolder(folder.id, name.trim());
    setFolders(getFolders());
  };

  const handleDeleteFolderAction = async (folder: DocFolder) => {
    if (!confirm(`"${folder.name}" 폴더 삭제?`)) return;
    await deleteFolder(folder.id, false);
    setFolders(getFolders());
    setDocs(getDocs());
  };

  const handleMoveDoc = async (doc: DocMeta, folderId?: string) => {
    await moveDocToFolder(doc.id, folderId ?? null);
    setDocs(getDocs());
  };

  /* FILTER + SEARCH + SORT --------------------------------------- */
  const filteredDocs = useMemo(() => {
    const q = query.toLowerCase().trim();

    return docsInFolder.filter((doc) => {
      if (filter === "starred" && !doc.starred) return false;
      if (filter === "recent") {
        const diff = Date.now() - new Date(doc.updatedAt).getTime();
        if (diff > 24 * 60 * 60 * 1000) return false;
      }
      if (!q) return true;

      return doc.title.toLowerCase().includes(q);
    });
  }, [docsInFolder, filter, query]);

  const sortedDocs = useMemo(() => {
    return [...filteredDocs].sort((a, b) => {
      let cmp = 0;

      if (sortKey === "title") cmp = a.title.localeCompare(b.title);
      else if (sortKey === "owner") cmp = a.owner.localeCompare(b.owner);
      else cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredDocs, sortKey, sortDir]);

  const readAllDocs = useMemo(
    () =>
      [...sortedDocs].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [sortedDocs],
  );

  useEffect(() => {
    if (!readAllMode || readAllDocs.length === 0) return;
    let cancelled = false;
    const preloadCounts = async () => {
      const pairs = await Promise.all(
        readAllDocs.map(async (doc) => {
          const list = await listDocumentComments(doc.id).catch(() => []);
          return [doc.id, list.length] as const;
        }),
      );
      if (cancelled) return;
      setCommentCountByDoc((prev) => {
        const next = { ...prev };
        pairs.forEach(([docId, count]) => {
          next[docId] = count;
        });
        return next;
      });
    };
    void preloadCounts();
    return () => {
      cancelled = true;
    };
  }, [readAllDocs, readAllMode]);

  const ensureCommentsLoaded = useCallback(async (docId: string) => {
    if (commentsByDoc[docId]) return commentsByDoc[docId];
    setLoadingCommentsByDoc((prev) => ({ ...prev, [docId]: true }));
    try {
      const list = await listDocumentComments(docId);
      setCommentsByDoc((prev) => ({ ...prev, [docId]: list }));
      setCommentCountByDoc((prev) => ({ ...prev, [docId]: list.length }));
      return list;
    } finally {
      setLoadingCommentsByDoc((prev) => ({ ...prev, [docId]: false }));
    }
  }, [commentsByDoc]);

  const toggleComments = async (docId: string) => {
    const willOpen = !openCommentsByDoc[docId];
    setOpenCommentsByDoc((prev) => ({ ...prev, [docId]: willOpen }));
    if (!willOpen) return;
    setVisibleCommentsByDoc((prev) => ({ ...prev, [docId]: prev[docId] ?? 5 }));
    await ensureCommentsLoaded(docId);
  };

  const submitReadAllComment = async (docId: string) => {
    const content = (draftByDoc[docId] ?? "").trim();
    if (!content) return;
    setSavingByDoc((prev) => ({ ...prev, [docId]: true }));
    try {
      const created = await createDocumentComment(docId, content);
      setCommentsByDoc((prev) => ({ ...prev, [docId]: [...(prev[docId] ?? []), created] }));
      setCommentCountByDoc((prev) => ({ ...prev, [docId]: (prev[docId] ?? 0) + 1 }));
      setDraftByDoc((prev) => ({ ...prev, [docId]: "" }));
    } finally {
      setSavingByDoc((prev) => ({ ...prev, [docId]: false }));
    }
  };

  /* UI ------------------------------------------------------------ */
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 bg-background p-4 sm:p-6">
      <CreateFolderModal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onSubmit={handleCreateFolder}
      />

      {!readAllMode && (
        <section className="border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="inline-flex items-center gap-2 text-sm font-semibold">
              <FileText size={16} className="text-brand" />
              프로젝트 문서
            </div>
            <div className="text-xs text-muted">{docs.length}개의 문서</div>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <button
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-subtle/60"
              onClick={handleCreateDoc}
            >
              새 문서
            </button>

            <button
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-subtle/60"
              onClick={() => setFolderModalOpen(true)}
            >
              새 폴더
            </button>

            <div className="ml-auto flex gap-2 items-center">
              <SortMenu
                sortKey={sortKey}
                sortDir={sortDir}
                onChange={(k) => setSortKey(k)}
                onToggleDir={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              />
              <button
                className={`rounded-md px-3 py-1.5 border ${
                  viewMode === "list"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted"
                }`}
                onClick={() => setViewMode("list")}
              >
                <ListIcon size={14} />
              </button>

              <button
                className={`rounded-md px-3 py-1.5 border ${
                  viewMode === "grid"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted"
                }`}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>

          <div className="border-t border-border px-4 py-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="문서 검색"
            />
          </div>
        </section>
      )}

      {readAllMode ? (
        <section className="flex-1">
          <div className="max-h-[calc(100vh-180px)] space-y-4 overflow-y-auto">
            {readAllDocs.map((doc) => {
              const markdown = docToMarkdown(doc.content);
              const html = renderMarkdownToHtml(markdown);
              const isLong = markdown.length > 900;
              const commentCount = commentCountByDoc[doc.id] ?? 0;
              const isCommentOpen = Boolean(openCommentsByDoc[doc.id]);
              const loadedComments = commentsByDoc[doc.id] ?? [];
              const visibleCount = visibleCommentsByDoc[doc.id] ?? 5;
              const shownComments = loadedComments.slice(0, visibleCount);
              const hasMoreComments = loadedComments.length > visibleCount;
              return (
                <article key={doc.id} className="border border-border bg-white p-4 dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="truncate text-sm font-semibold text-foreground">{doc.title}</h3>
                    <button
                      type="button"
                      onClick={() => router.push(buildHref(["docs", doc.id], `/docs/${doc.id}`))}
                      className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-slate-700 hover:bg-subtle/60 hover:text-foreground dark:text-slate-200"
                    >
                      문서 열기
                    </button>
                  </div>
                  <div className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                    <article
                      className={`prose prose-sm max-w-none text-slate-900 prose-pre:rounded-lg prose-pre:border prose-pre:border-slate-300 prose-pre:bg-slate-100 prose-pre:text-slate-900 prose-code:rounded prose-code:bg-transparent prose-code:px-1 prose-code:py-0.5 prose-code:text-slate-900 prose-code:before:content-none prose-code:after:content-none dark:text-slate-100 dark:prose-invert dark:prose-pre:border-slate-700 dark:prose-pre:bg-slate-800 dark:prose-pre:text-slate-100 dark:prose-code:bg-transparent dark:prose-code:text-slate-100 ${isLong ? "max-h-[300px] overflow-hidden" : ""}`}
                      dangerouslySetInnerHTML={{ __html: html || "<p>내용 없음</p>" }}
                    />
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => void toggleComments(doc.id)}
                      className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-slate-700 hover:bg-subtle/60 hover:text-foreground dark:text-slate-200"
                    >
                      {isCommentOpen ? "댓글 숨기기" : `댓글 ${commentCount}개`}
                    </button>
                  </div>
                  {isCommentOpen && (
                    <div className="mt-2 border-t border-border pt-3">
                      {loadingCommentsByDoc[doc.id] ? (
                        <p className="text-xs text-muted-foreground">댓글을 불러오는 중입니다...</p>
                      ) : shownComments.length === 0 ? (
                        <p className="text-xs text-muted-foreground">댓글이 없습니다.</p>
                      ) : (
                        <div className="space-y-2">
                          {shownComments.map((comment) => (
                            <div key={comment.id} className="bg-white px-1 py-1 dark:bg-slate-900">
                              <div className="flex gap-2">
                                <ReadAllAvatar name={comment.authorName || "익명"} src={comment.authorAvatarUrl ?? undefined} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="truncate font-medium text-foreground">
                                      {comment.authorName || "익명"}
                                    </span>
                                    <span className="shrink-0 text-muted-foreground">
                                      {formatKoreanDateTime(comment.createdAt)}
                                    </span>
                                  </div>
                                  <article
                                    className="prose prose-sm mt-0.5 max-w-none text-slate-900 prose-pre:rounded-lg prose-pre:border prose-pre:border-slate-300 prose-pre:bg-slate-100 prose-pre:text-slate-900 prose-code:rounded prose-code:bg-transparent prose-code:px-1 prose-code:py-0.5 prose-code:text-slate-900 prose-code:before:content-none prose-code:after:content-none dark:text-slate-100 dark:prose-invert dark:prose-pre:border-slate-700 dark:prose-pre:bg-slate-800 dark:prose-pre:text-slate-100 dark:prose-code:bg-transparent dark:prose-code:text-slate-100"
                                    dangerouslySetInnerHTML={{
                                      __html: renderMarkdownToHtml(comment.content || ""),
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          {hasMoreComments && (
                            <button
                              type="button"
                              onClick={() =>
                                setVisibleCommentsByDoc((prev) => ({
                                  ...prev,
                                  [doc.id]: (prev[doc.id] ?? 5) + 5,
                                }))
                              }
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              ...더보기
                            </button>
                          )}
                        </div>
                      )}

                      <div className="mt-3 border border-border pt-3">
                        <textarea
                          value={draftByDoc[doc.id] ?? ""}
                          onChange={(e) =>
                            setDraftByDoc((prev) => ({
                              ...prev,
                              [doc.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              void submitReadAllComment(doc.id);
                            }
                          }}
                          rows={2}
                          placeholder="댓글을 입력하세요..."
                          className="w-full resize-y rounded-md bg-muted/40 px-3 py-2 text-sm focus:outline-none dark:bg-slate-800 dark:text-slate-100"
                        />
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            disabled={savingByDoc[doc.id] || !(draftByDoc[doc.id] ?? "").trim()}
                            onClick={() => void submitReadAllComment(doc.id)}
                            className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-60"
                          >
                            등록
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
            {readAllDocs.length === 0 && (
              <p className="px-1 text-sm text-muted-foreground">표시할 문서가 없습니다.</p>
            )}
          </div>
        </section>
      ) : (
        <>
          {/* 폴더 그리드 */}
          <FolderGrid
            folders={folders}
            counts={new Map()}
            totalCount={docs.length}
            unfiledCount={docs.filter((d) => d.locations.length === 0).length}
            activeFolder={activeFolder}
            onSelect={setActiveFolder}
            onRename={handleRenameFolder}
            onDelete={handleDeleteFolderAction}
          />

          {/* 문서 리스트 / 그리드 */}
          <section className="flex-1 border border-border bg-background">
            {viewMode === "grid" ? (
              <DocumentGrid
                docs={sortedDocs}
                onOpen={(doc) => router.push(buildHref(["docs", doc.id], `/docs/${doc.id}`))}
                onToggleStar={handleToggleStar}
              />
            ) : (
              <DocumentTable
                docs={sortedDocs}
                folders={folders}
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={setSortKey}
                onOpen={(doc) => router.push(buildHref(["docs", doc.id], `/docs/${doc.id}`))}
                onRename={handleRename}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
                onMove={handleMoveDoc}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ReadAllAvatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      <div className="relative h-8 w-8 overflow-hidden rounded-full">
        <Image src={src} alt={name} fill sizes="32px" />
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
      {name.slice(0, 1)}
    </div>
  );
}

function formatKoreanDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hours24 = date.getHours();
  const period = hours24 >= 12 ? "오후" : "오전";
  const hours12 = hours24 % 12 || 12;
  const hh = String(hours12).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${period} ${hh}:${min}`;
}
