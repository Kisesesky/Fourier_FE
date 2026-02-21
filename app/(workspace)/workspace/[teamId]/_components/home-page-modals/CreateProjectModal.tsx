// app/(workspace)/workspace/[teamId]/_components/home-page-modals/CreateProjectModal.tsx
import IconPickerSection from "./IconPickerSection";
import type { CreateProjectModalProps, StatusType } from "./types";

export default function CreateProjectModal({
  open,
  projectName,
  description,
  status,
  icon,
  creating,
  onClose,
  onSetProjectName,
  onSetDescription,
  onSetStatus,
  onCreate,
}: CreateProjectModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-border bg-panel p-6 text-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.45em] text-muted">Create a project</p>
          <h2 className="text-2xl font-semibold">
            {projectName.trim()
              ? projectName.trim().endsWith("'s Project")
                ? projectName.trim()
                : `${projectName.trim()}'s Project`
              : "Start something new"}
          </h2>
          <p className="text-sm text-muted">Add an icon, a short description, and status.</p>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-accent/40 p-4">
          <IconPickerSection {...icon} label="Project" />
        </div>

        <div className="mt-5 space-y-4">
          <input
            className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
            placeholder="Project name"
            value={projectName}
            onChange={(e) => onSetProjectName(e.target.value)}
          />
          <textarea
            className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
            placeholder="Description"
            rows={3}
            value={description}
            onChange={(e) => onSetDescription(e.target.value)}
          />
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
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 text-sm">
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
            disabled={!projectName.trim() || creating}
            onClick={onCreate}
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
