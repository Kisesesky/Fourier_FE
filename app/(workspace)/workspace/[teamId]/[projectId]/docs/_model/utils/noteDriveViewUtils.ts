// app/(workspace)/workspace/[teamId]/[projectId]/docs/_model/utils/noteDriveViewUtils.ts
export const MENU_ATTR = { 'data-doc-menu': 'true' } as const;

export function relativeTime(iso: string) {
  const target = new Date(iso).getTime();
  const diff = Date.now() - target;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return '방금 전';
  if (diff < hour) return `${Math.floor(diff / minute)}분 전`;
  if (diff < day) return `${Math.floor(diff / hour)}시간 전`;
  if (diff < day * 7) return `${Math.floor(diff / day)}일 전`;
  return new Date(iso).toLocaleDateString();
}

export function formatFileSize(size?: number) {
  if (!size || size <= 0) return '-';
  if (size < 1024) return `${size}KB`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}MB`;
  return `${(size / (1024 * 1024)).toFixed(1)}GB`;
}
