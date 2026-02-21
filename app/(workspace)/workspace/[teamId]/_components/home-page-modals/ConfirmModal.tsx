// app/(workspace)/workspace/[teamId]/_components/home-page-modals/ConfirmModal.tsx
import Modal from "@/components/common/Modal";
import type { ConfirmModalProps } from "./types";

export default function ConfirmModal({ open, title, message, onClose, onConfirm }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} widthClass="max-w-md">
      <div className="p-6 space-y-4">
        <p className="text-sm text-muted">{message}</p>
        <div className="flex justify-end gap-2 text-sm">
          <button
            type="button"
            className="rounded-full border border-border px-4 py-1.5 text-muted"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-full bg-rose-500 px-5 py-1.5 text-white disabled:opacity-50"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
