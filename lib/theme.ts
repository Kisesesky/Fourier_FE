export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'fd.theme';

const THEME_SEQUENCE: ThemeMode[] = ['light', 'dark', 'system'];

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

export function persistTheme(mode: ThemeMode) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const dark = mode === 'system' ? prefersDark : mode === 'dark';
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
}

export function nextThemeMode(current: ThemeMode): ThemeMode {
  const idx = THEME_SEQUENCE.indexOf(current);
  if (idx === -1) return 'light';
  return THEME_SEQUENCE[(idx + 1) % THEME_SEQUENCE.length];
}
