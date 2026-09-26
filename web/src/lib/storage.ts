/**
 * localStorage for per-browser conveniences only. Every access can throw
 * (private windows, blocked site data), and the app must work without it.
 */
export function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function save(key: string, value: unknown): void {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable; losing a preference is fine.
  }
}

export const KEYS = {
  style: 'qr.style.v1',
  presets: 'qr.presets.v1',
  rememberContent: 'qr.remember-content.v1',
  content: 'qr.content.v1',
} as const;
