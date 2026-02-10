// components/layout/sidebar/FilePanel.tsx
'use client';

import clsx from "clsx";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Archive, Folder, FolderPlus, MoreHorizontal } from "lucide-react";

import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { emitFileVaultChanged } from "@/workspace/file/_model/vault";
import { useProjectFileFolders } from "@/workspace/file/_model/hooks/useProjectFileFolders";
import { createFileFolder, deleteFileFolder, updateFileFolder } from "@/workspace/file/_service/api";

export default function FilePanel() {
  const router = useRouter();
  const { buildHref } = useWorkspacePath();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { projectId } = useParams<{ projectId: string }>();
  const { folders } = useProjectFileFolders(projectId);
  const [menu, setMenu] = useState<{ folderId: string; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [modalType, setModalType] = useState<"create" | "rename" | "delete" | null>(null);
  const [modalFolderId, setModalFolderId] = useState<string | null>(null);
  const [folderNameInput, setFolderNameInput] = useState("");

  const selectedFolderId = searchParams?.get("folder") ?? null;

  useEffect(() => {
    if (!menu) return;
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) setMenu(null);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(null);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onEscape);
    };
  }, [menu]);

  const moveToAll = () => {
    router.push(buildHref("file", "/file"));
  };

  const moveToFolder = (folderId: string) => {
    const base = buildHref("file", "/file");
    router.push(`${base}?folder=${folderId}`);
  };

  const openMenuAt = (folderId: string, x: number, y: number) => {
    const width = 144;
    const height = 84;
    const clampedX = Math.max(8, Math.min(x, window.innerWidth - width - 8));
    const clampedY = Math.max(8, Math.min(y, window.innerHeight - height - 8));
    setMenu({ folderId, x: clampedX, y: clampedY });
  };

  const openCreateModal = () => {
    setFolderNameInput("");
    setModalFolderId(null);
    setModalType("create");
  };

  const createFolder = async () => {
    const name = folderNameInput.trim();
    if (!name || !projectId) return;
    const created = await createFileFolder(projectId, name);
    emitFileVaultChanged();
    setModalType(null);
    setFolderNameInput("");
    moveToFolder(created.id);
  };

  const openRenameModal = (folderId: string) => {
    const folder = folders.find((item) => item.id === folderId);
    if (!folder) return;
    setFolderNameInput(folder.name);
    setModalFolderId(folderId);
    setModalType("rename");
    setMenu(null);
  };

  const renameFolder = async (folderId: string) => {
    const folder = folders.find((item) => item.id === folderId);
    if (!folder) return;
    const nextName = folderNameInput.trim();
    if (!nextName || nextName === folder.name) return;
    await updateFileFolder(folderId, nextName);
    emitFileVaultChanged();
    setFolderNameInput("");
    setModalFolderId(null);
    setModalType(null);
    setMenu(null);
  };

  const openDeleteModal = (folderId: string) => {
    setModalFolderId(folderId);
    setModalType("delete");
    setMenu(null);
  };

  const deleteFolder = async (folderId: string) => {
    await deleteFileFolder(folderId);
    emitFileVaultChanged();
    if (selectedFolderId === folderId) moveToAll();
    setModalFolderId(null);
    setModalType(null);
    setMenu(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-border/70 pb-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">파일 트리</p>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted transition hover:bg-sidebar-accent hover:text-foreground"
          title="폴더 추가"
        >
          <FolderPlus size={14} />
        </button>
      </div>

      <button
        type="button"
        onClick={moveToAll}
        className={clsx(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition",
          !selectedFolderId && pathname?.includes("/file")
            ? "bg-blue-50 text-blue-700"
            : "text-foreground hover:bg-subtle/70",
        )}
      >
        <Archive size={14} />
        <span>전체보기</span>
      </button>

      <div className="space-y-1">
        {folders.map((folder) => {
          const isActive = selectedFolderId === folder.id;
          return (
            <div
              key={folder.id}
              className={clsx(
                "group relative flex items-center rounded-md pr-8 transition",
                isActive ? "bg-blue-50 text-blue-700" : "hover:bg-subtle/70",
              )}
              onContextMenu={(event) => {
                event.preventDefault();
                openMenuAt(folder.id, event.clientX, event.clientY);
              }}
            >
              <button
                type="button"
                onClick={() => moveToFolder(folder.id)}
                className={clsx(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition",
                  isActive ? "text-blue-700" : "text-foreground",
                )}
              >
                <Folder size={14} />
                <span className="truncate">{folder.name}</span>
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  openMenuAt(folder.id, rect.right - 136, rect.bottom + 6);
                }}
                className="absolute right-1 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted opacity-0 transition hover:bg-sidebar-accent hover:text-foreground group-hover:opacity-100"
                title="메뉴"
              >
                <MoreHorizontal size={14} />
              </button>
            </div>
          );
        })}
      </div>
      {menu ? (
        <div
          ref={menuRef}
          className="fixed z-[120] w-36 rounded-md border border-border bg-panel py-1 shadow-lg"
          style={{ left: menu.x, top: menu.y }}
        >
          <button
            type="button"
            onClick={() => openRenameModal(menu.folderId)}
            className="flex w-full items-center px-3 py-2 text-left text-xs text-foreground transition hover:bg-sidebar-accent"
          >
            이름 변경
          </button>
          <button
            type="button"
            onClick={() => openDeleteModal(menu.folderId)}
            disabled={false}
            className={clsx(
              "flex w-full items-center px-3 py-2 text-left text-xs transition",
              "text-rose-600 hover:bg-rose-50/70",
            )}
          >
            삭제
          </button>
        </div>
      ) : null}
      {modalType ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-panel p-4 shadow-xl">
            <p className="text-sm font-semibold text-foreground">
              {modalType === "create" ? "폴더 추가" : modalType === "rename" ? "폴더 이름 변경" : "폴더 삭제"}
            </p>
            {modalType === "delete" ? (
              <p className="mt-2 text-sm text-muted">
                '{folders.find((item) => item.id === modalFolderId)?.name ?? "폴더"}' 폴더를 삭제하시겠습니까?
              </p>
            ) : (
              <div className="mt-3">
                <input
                  autoFocus
                  value={folderNameInput}
                  onChange={(event) => setFolderNameInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      if (modalType === "create") createFolder();
                      if (modalType === "rename" && modalFolderId) renameFolder(modalFolderId);
                    }
                  }}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                  placeholder="폴더 이름"
                />
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalType(null);
                  setModalFolderId(null);
                  setFolderNameInput("");
                }}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-muted transition hover:bg-sidebar-accent hover:text-foreground"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (modalType === "create") void createFolder();
                  if (modalType === "rename" && modalFolderId) void renameFolder(modalFolderId);
                  if (modalType === "delete" && modalFolderId) void deleteFolder(modalFolderId);
                }}
                className={clsx(
                  "rounded-md px-3 py-1.5 text-xs text-white transition",
                  modalType === "delete" ? "bg-rose-500 hover:bg-rose-600" : "bg-blue-600 hover:bg-blue-700",
                )}
              >
                {modalType === "delete" ? "삭제" : "저장"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
