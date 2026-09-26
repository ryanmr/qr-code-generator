import { CONTENT_TYPES, EMPTY_FIELDS, type Content, type ContentType } from '@/lib/payload';
import { sanitizeStyle, type Style } from '@/lib/style';

/**
 * Share links carry everything in the URL hash. Browsers never send the hash
 * to the server, so a shared code's content does not show up in Traefik or
 * app logs. It does land in the recipient's history, which is why links are
 * only made on request and the address bar is not kept in sync.
 */
const KEY = 'q';

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function shareUrl(content: Content, style: Style, base = location.href): string {
  const url = new URL(base);
  url.search = '';
  url.hash = `${KEY}=${toBase64Url(JSON.stringify({ c: content, s: style }))}`;
  return url.toString();
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
