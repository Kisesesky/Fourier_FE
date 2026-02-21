// app/(workspace)/workspace/[teamId]/_components/home-page-modals/IconPickerSection.tsx
import type { IconPickerProps } from "./types";

export default function IconPickerSection({
  label,
  iconValue,
  iconMode,
  iconFile,
  uploading,
  onSetIconMode,
  onSetIconValue,
  onSetIconFile,
  onUploadIcon,
}: IconPickerProps) {
  return (
    <>
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-panel">
        {iconValue ? (
          <img src={iconValue} alt={`${label} icon`} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-muted">Icon</span>
        )}
      </div>
      <div className="flex-1">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-[11px] uppercase tracking-[0.3em] text-muted">{label} Icon</label>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              className={`rounded-full border px-3 py-1 ${iconMode === "url" ? "border-primary text-foreground" : "border-border text-muted"}`}
              onClick={() => onSetIconMode("url")}
            >
              URL
            </button>
            <button
              type="button"
              className={`rounded-full border px-3 py-1 ${iconMode === "upload" ? "border-primary text-foreground" : "border-border text-muted"}`}
              onClick={() => onSetIconMode("upload")}
            >
              Upload
            </button>
          </div>
        </div>
        {iconMode === "url" ? (
          <input
            className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
            placeholder="https://..."
            value={iconValue}
            onChange={(e) => onSetIconValue(e.target.value)}
          />
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm text-muted"
              onChange={(e) => onSetIconFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="rounded-full bg-primary px-4 py-1.5 text-xs text-primary-foreground disabled:opacity-50"
              disabled={!iconFile || uploading}
              onClick={onUploadIcon}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
