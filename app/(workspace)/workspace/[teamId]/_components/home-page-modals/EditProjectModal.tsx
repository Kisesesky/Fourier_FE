// app/(workspace)/workspace/[teamId]/_components/home-page-modals/EditProjectModal.tsx
import Modal from "@/components/common/Modal";
import IconPickerSection from "./IconPickerSection";
import type { EditProjectModalProps, StatusType } from "./types";

export default function EditProjectModal({
  open,
  projectName,
  status,
  icon,
  onClose,
  onSetProjectName,
  onSetStatus,
  onSave,
}: EditProjectModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="프로젝트 수정" widthClass="max-w-md">
      <div className="p-6 space-y-5">
        <div className="space-y-2">
          <p className="text-sm text-muted">이름, 아이콘, 상태를 업데이트하세요.</p>
          <input
            className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
            value={projectName}
            onChange={(e) => onSetProjectName(e.target.value)}
            placeholder="프로젝트 이름"
          />
        </div>
        <div className="space-y-3 rounded-2xl border border-border bg-accent/40 p-4">
          <div className="flex items-center gap-3">
            <IconPickerSection {...icon} label="Project" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-muted">Status</label>
          <select
            className="h-10 w-full rounded-xl border border-border bg-panel px-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
            value={status}
            onChange={(e) => onSetStatus(e.target.value as StatusType)}
          >
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>
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
            className="rounded-full bg-primary px-5 py-1.5 text-primary-foreground disabled:opacity-50"
            disabled={!projectName.trim()}
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
