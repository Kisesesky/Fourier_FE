"use client";

import { RefreshCcw, History, FolderPlus, FilePlus } from "lucide-react";
import { useState } from "react";
import { createFolder, createDoc, getFolders } from "@/workspace/docs/_model/docs";

export default function TreeToolbar({ onRefresh }: { onRefresh: () => void }) {
  const [mode, setMode] = useState<"folder" | "doc">("folder");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");

  const folders = getFolders();

  const createItem = () => {
    if (!name.trim()) return;

    const parent = parentId || undefined;

    if (mode === "folder") createFolder(name.trim(), parent);
    else createDoc(name.trim(), parent);

    setName("");
    setParentId("");
    setOpen(false);
    onRefresh();
  };

  return (
    <>
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          <button
            className="p-1 rounded-md hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={() => {
              setMode("folder");
              setOpen(true);
            }}
          >
            <FolderPlus size={16} />
          </button>

          <button
            className="p-1 rounded-md hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={() => {
              setMode("doc");
              setOpen(true);
            }}
          >
            <FilePlus size={16} />
          </button>

          <button
            className="p-1 rounded-md hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={onRefresh}
          >
            <RefreshCcw size={16} />
          </button>

          <button
            className="p-1 rounded-md hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={() => alert("히스토리 기능은 곧 업데이트 예정입니다.")}
          >
            <History size={16} />
          </button>
        </div>
      </div>

      {/* 모달 */}
      {open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[360px] p-5 rounded-2xl shadow-xl space-y-4 animate-fadeIn">
            <h3 className="font-semibold text-base">
              {mode === "folder" ? "새 폴더 만들기" : "새 문서 만들기"}
            </h3>

            <div>
              <p className="text-xs text-gray-500">이름</p>
              <input
                className="w-full border px-3 py-2 rounded-lg text-sm"
                placeholder="이름 입력"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <p className="text-xs text-gray-500">위치</p>
              <select
                className="w-full border px-3 py-2 rounded-lg text-sm bg-white"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">최상위</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                취소
              </button>

              <button
                className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-black/90"
                onClick={createItem}
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
