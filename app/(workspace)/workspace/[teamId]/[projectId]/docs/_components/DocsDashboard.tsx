"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List as ListIcon, Star, FolderPlus, Upload, Clock3, CalendarClock, Users } from "lucide-react";

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
  addDocLocation,
  removeDocLocation,
} from "@/workspace/docs/_model/docs";

import { subscribeDocsEvent } from "@/workspace/docs/_model/events";
import { DocumentGrid } from "@/workspace/docs/_components/note-drive/DocumentGrid";
import { DocumentTable, type SortKey } from "@/workspace/docs/_components/note-drive/DocumentTable";
import { FolderGrid } from "@/workspace/docs/_components/note-drive/FolderGrid";
import { FilterMenu } from "@/workspace/docs/_components/note-drive/FilterMenu";
import { SortMenu } from "@/workspace/docs/_components/note-drive/SortMenu";
import { CreateFolderModal } from "@/workspace/docs/_components/note-drive/CreateFolderModal";
import { DocMeta, DocFolder } from "@/workspace/docs/_model/types";

type FilterKey = "all" | "starred" | "shared" | "recent";

export default function DocsDashboard() {
  const router = useRouter();

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

  /* SYNC EVENTS -------------------------------------------------- */
  useEffect(() => {
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
  const handleCreateDoc = () => {
    const primary = activeFolder === "all" ? undefined : activeFolder;
    const newDoc = createDoc("새 문서", primary);
    setDocs(getDocs());
    router.push(`/docs/${newDoc.id}`);
  };

  const handleDuplicate = (doc: DocMeta) => {
    const copy = createDoc(`${doc.title} 복제본`, resolvePrimaryLocation(doc), {
      icon: doc.icon,
      color: doc.color,
    });
    setDocs(getDocs());
  };

  const handleRename = (doc: DocMeta) => {
    const name = prompt("문서 이름을 입력하세요", doc.title);
    if (!name?.trim()) return;
    renameDoc(doc.id, name.trim());
    setDocs(getDocs());
  };

  const handleToggleStar = (doc: DocMeta) => {
    renameDoc(doc.id, doc.title); // 업데이트만 트리거
    const updated = docs.map((d) =>
      d.id === doc.id ? { ...d, starred: !d.starred } : d
    );
    setDocs(updated);
  };

  const handleDelete = (doc: DocMeta) => {
    if (!confirm(`"${doc.title}"을 삭제할까요?`)) return;
    deleteDoc(doc.id);
    setDocs(getDocs());
  };

  const handleCreateFolder = (name: string) => {
    createFolder(name);
    setFolders(getFolders());
    setFolderModalOpen(false);
  };

  const handleRenameFolder = (folder: DocFolder) => {
    const name = prompt("폴더 이름 입력", folder.name);
    if (!name?.trim()) return;
    renameFolder(folder.id, name.trim());
    setFolders(getFolders());
  };

  const handleDeleteFolderAction = (folder: DocFolder) => {
    if (!confirm(`"${folder.name}" 폴더 삭제?`)) return;
    deleteFolder(folder.id, false);
    setFolders(getFolders());
    setDocs(getDocs());
  };

  const handleMoveDoc = (doc: DocMeta, folderId?: string) => {
    moveDocToFolder(doc.id, folderId ?? null);
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
      else if (sortKey === "size") cmp = (a.fileSize || 0) - (b.fileSize || 0);
      else cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredDocs, sortKey, sortDir]);

  /* UI ------------------------------------------------------------ */
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <CreateFolderModal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onSubmit={handleCreateFolder}
      />

      {/* 상단 헤더 */}
      <section className="rounded-3xl border bg-panel/70 border-border shadow-panel">
        <div className="flex justify-between items-center px-4 py-4">
          <div className="text-sm font-semibold">내 드라이브</div>
          <div className="text-xs text-muted">{docs.length}개의 문서</div>
        </div>

        {/* 액션 바 */}
        <div className="flex gap-2 px-4 py-3 border-t border-border/60">
          <button
            className="btn"
            onClick={handleCreateDoc}
          >
            새 문서
          </button>

          <button
            className="btn"
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
              className={`rounded px-3 py-1 border ${
                viewMode === "list"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted"
              }`}
              onClick={() => setViewMode("list")}
            >
              <ListIcon size={14} />
            </button>

            <button
              className={`rounded px-3 py-1 border ${
                viewMode === "grid"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted"
              }`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="border-t border-border/60 px-4 py-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border bg-panel/30"
            placeholder="문서 검색"
          />
        </div>
      </section>

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
      <section className="flex-1 rounded-3xl border border-border bg-panel/70 shadow-panel">
        {viewMode === "grid" ? (
          <DocumentGrid
            docs={sortedDocs}
            onOpen={(doc) => router.push(`/docs/${doc.id}`)}
            onToggleStar={handleToggleStar}
          />
        ) : (
          <DocumentTable
            docs={sortedDocs}
            folders={folders}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={setSortKey}
            onOpen={(doc) => router.push(`/docs/${doc.id}`)}
            onRename={handleRename}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onToggleStar={handleToggleStar}
            onMove={handleMoveDoc}
          />
        )}
      </section>
    </div>
  );
}
