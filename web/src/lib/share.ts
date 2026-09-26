import { CONTENT_TYPES, EMPTY_FIELDS, type Content, type ContentType } from '@/lib/payload';
import { sanitizeStyle, type Style } from '@/lib/style';

/**
 * Reads the older `#q=<base64 JSON>` share links. New links use readable query
 * parameters (query.ts); this stays so links already handed out keep working.
 */
const KEY = 'q';

function fromBase64Url(s: string): string {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function sanitizeContent(raw: unknown): Content | null {
  if (!raw || typeof raw !== 'object') return null;
  const { type, fields } = raw as { type?: unknown; fields?: unknown };
  if (!CONTENT_TYPES.includes(type as ContentType)) return null;
  const t = type as ContentType;
  const out: Record<string, unknown> = { ...EMPTY_FIELDS[t] };
  if (fields && typeof fields === 'object') {
    for (const [k, d] of Object.entries(out)) {
      const v = (fields as Record<string, unknown>)[k];
      if (typeof v === typeof d) out[k] = v;
    }
  }
  if (t === 'wifi' && !['WPA', 'WEP', 'nopass'].includes(out.security as string)) out.security = 'WPA';
  return { type: t, fields: out } as Content;
}

export function readShareHash(hash = location.hash): { content: Content; style: Style } | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const raw = params.get(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(raw)) as { c?: unknown; s?: unknown };
    const content = sanitizeContent(parsed.c);
    if (!content) return null;
    return { content, style: sanitizeStyle(parsed.s) };
  } catch {
    return null;
  }
}
