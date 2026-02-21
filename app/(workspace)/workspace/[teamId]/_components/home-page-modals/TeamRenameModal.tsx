// app/(workspace)/workspace/[teamId]/_components/home-page-modals/TeamRenameModal.tsx
import Modal from "@/components/common/Modal";
import IconPickerSection from "./IconPickerSection";
import type { TeamRenameModalProps } from "./types";

export default function TeamRenameModal({
  open,
  teamName,
  icon,
  onClose,
  onSetTeamName,
  onSave,
}: TeamRenameModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="팀 수정" widthClass="max-w-md">
      <div className="p-6 space-y-4">
        <p className="text-sm text-muted">팀 이름과 아이콘을 수정하세요.</p>
        <input
          className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
          value={teamName}
          onChange={(e) => onSetTeamName(e.target.value)}
          placeholder="팀 이름"
        />
        <div className="space-y-3 rounded-2xl border border-border bg-accent/40 p-4">
          <div className="flex items-center gap-3">
            <IconPickerSection {...icon} label="Team" />
          </div>
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
            disabled={!teamName.trim()}
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
