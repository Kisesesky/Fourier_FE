"use client";

import { useEffect, useRef, useState } from "react";
import { TreeContextTarget } from "@/workspace/docs/_model/types";
import {
  deleteFolder,
  deleteDoc,
  renameFolder,
  renameDoc,
} from "@/workspace/docs/_model/docs";

import { Pencil, Trash2 } from "lucide-react";
import DeleteConfirmModal from "./DeleteConfirmModal";

interface Props {
  x: number;
  y: number;
  target: TreeContextTarget;
  onClose: () => void;
}

export default function TreeContextMenu({ x, y, target, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  /* ESC로 닫기 */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  /* 외부 클릭 닫기 */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const rename = () => {
    const value = prompt("새 이름을 입력하세요");
    if (!value) return;

    if (target.type === "folder") renameFolder(target.id, value);
    else renameDoc(target.id, value);

    onClose();
  };

  const deleteAction = () => {
    if (target.type === "folder") deleteFolder(target.id, true);
    else deleteDoc(target.id);

    onClose();
  };

  return (
    <>
      {/* Context Menu */}
      <div
        ref={menuRef}
        className="fixed bg-white border shadow-lg rounded-md text-sm w-40 py-1"
        style={{ top: y, left: x, zIndex: 999 }}
      >
        <button
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
          onClick={rename}
        >
          <Pencil size={15} />
          이름 변경
        </button>

        <button
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left text-red-600"
          onClick={() => setOpenDeleteModal(true)}
        >
          <Trash2 size={15} />
          삭제
        </button>
      </div>

      {/* 삭제 모달 */}
      <DeleteConfirmModal
        open={openDeleteModal}
        title={target.type === "folder" ? "폴더 삭제" : "문서 삭제"}
        description={
          target.type === "folder"
            ? "이 폴더와 내부 모든 항목을 삭제하시겠습니까?"
            : "이 문서를 삭제하시겠습니까?"
        }
        onCancel={() => setOpenDeleteModal(false)}
        onConfirm={deleteAction}
      />
    </>
  );
}
