// app/(workspace)/workspace/[teamId]/_components/home-page-modals/CreateTeamModal.tsx
import IconPickerSection from "./IconPickerSection";
import type { CreateTeamModalProps } from "./types";

export default function CreateTeamModal({
  open,
  teamName,
  icon,
  creating,
  onClose,
  onSetTeamName,
  onCreate,
}: CreateTeamModalProps) {
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
          <p className="text-[11px] uppercase tracking-[0.45em] text-muted">Create a team</p>
          <h2 className="text-2xl font-semibold">{teamName.trim() ? `${teamName.trim()}'s Team` : "Name your space"}</h2>
          <p className="text-sm text-muted">Teams keep projects organized. You can rename anytime.</p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-accent/40 p-4">
          <div className="flex items-center gap-4">
            <IconPickerSection {...icon} label="Team" />
          </div>
          <div className="mt-4">
            <label className="text-[11px] uppercase tracking-[0.3em] text-muted">Team Name</label>
            <input
              className="mt-3 w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
              placeholder="Team name"
              value={teamName}
              onChange={(e) => onSetTeamName(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            className="rounded-full bg-primary px-5 py-1.5 text-primary-foreground disabled:opacity-50"
            disabled={!teamName.trim() || creating}
            onClick={onCreate}
          >
            {creating ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            className="rounded-full border border-border px-4 py-1.5 text-muted"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
