import { CONTENT_TYPES, EMPTY_FIELDS, type Content, type ContentType } from '@/lib/payload';
import { DEFAULT_STYLE, sanitizeStyle, type Style } from '@/lib/style';

/**
 * The whole generator state as readable query parameters, e.g.
 *
 *   /?url=example.com
 *   /?type=wifi&ssid=Home&password=hunter2
 *   /?url=example.com&shape=dots&frame=circle&fg=1e3a8a&size=2048
 *
 * "Share link" writes this into the clipboard and the address bar, and the URL
 * reproduces the code. Content fields use the same names as the form (`Fields` in
 * payload.ts). The server logs paths only, never the query string.
 */

/** Query key → Style key. Short, readable names for hand-written URLs. */
const STYLE_KEYS = {
  shape: 'moduleShape',
  frame: 'eyeFrame',
  ball: 'eyeBall',
  fg: 'fg',
  fg2: 'fg2',
  bg: 'bg',
  eye: 'eyeColor',
  gradient: 'gradient',
  angle: 'gradientAngle',
  transparent: 'transparent',
  margin: 'margin',
  radius: 'cornerRadius',
  ecc: 'ecc',
  boost: 'boostEcc',
  version: 'minVersion',
  mask: 'mask',
  size: 'size',
} as const satisfies Record<string, keyof Style>;

type QueryKey = keyof typeof STYLE_KEYS;

const COLOR_KEYS = new Set<keyof Style>(['fg', 'fg2', 'bg', 'eyeColor']);

function encodeValue(key: keyof Style, v: Style[keyof Style]): string {
  if (v === null) return 'none';
  // Hex colours drop the # so the URL does not need %23.
  if (COLOR_KEYS.has(key)) return String(v).replace(/^#/, '');
  if (typeof v === 'boolean') return v ? '1' : '0';
  return String(v);
}

function decodeValue(key: keyof Style, raw: string): unknown {
  if (COLOR_KEYS.has(key)) {
    if (key === 'eyeColor' && raw === 'none') return null;
    return `#${raw.replace(/^#/, '')}`;
  }
  const d = DEFAULT_STYLE[key];
  if (typeof d === 'boolean') return raw === '1' || raw === 'true';
  if (typeof d === 'number') return Number(raw);
  return raw;
}

export function toQuery(content: Content, style: Style): string {
  const q = new URLSearchParams();
  // `url` is the default type, so a plain link stays as short as ?url=…
  if (content.type !== 'url') q.set('type', content.type);
  for (const [k, v] of Object.entries(content.fields)) {
    const d = (EMPTY_FIELDS[content.type] as Record<string, unknown>)[k];
    if (v !== d) q.set(k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
  }
  // `shape` is always written: its presence marks a URL as carrying a full
  // style, so omitted keys mean "default" rather than "whatever this browser
  // last used".
  for (const [qk, sk] of Object.entries(STYLE_KEYS) as [QueryKey, keyof Style][]) {
    if (qk === 'shape' || style[sk] !== DEFAULT_STYLE[sk]) q.set(qk, encodeValue(sk, style[sk]));
  }
  // `:` and `/` are legal in a query, so leave them readable: ?url=https://…
  return q.toString().replace(/%3A/gi, ':').replace(/%2F/gi, '/');
}

function inferType(q: URLSearchParams): ContentType | null {
  const explicit = q.get('type');
  if (CONTENT_TYPES.includes(explicit as ContentType)) return explicit as ContentType;
  // Without `type`, the first type whose fields appear wins, so hand-written
  // ?text=…, ?ssid=… and ?lat=…&lng=… all work.
  return CONTENT_TYPES.find((t) => Object.keys(EMPTY_FIELDS[t]).some((k) => q.has(k))) ?? null;
}

/**
 * Reads whatever the query provides. Content is null when no content fields
 * are present, and style is null when no style keys are.
 *
 * With `shape` present the URL is a full description (that is what "Share link"
 * produces), so missing keys mean default. Without it, style keys
 * adjust `saved`, so a hand-written ?url=…&size=2048 keeps this browser's look.
 */
export function fromQuery(
  search: string,
  saved: Style = DEFAULT_STYLE,
): { content: Content | null; style: Style | null } {
  const q = new URLSearchParams(search);

  let content: Content | null = null;
  const type = inferType(q);
  if (type) {
    const fields: Record<string, unknown> = { ...EMPTY_FIELDS[type] };
    for (const [k, d] of Object.entries(fields)) {
      const v = q.get(k);
      if (v === null) continue;
      fields[k] = typeof d === 'boolean' ? v === '1' || v === 'true' : v;
    }
    if (type === 'wifi' && !['WPA', 'WEP', 'nopass'].includes(fields.security as string)) fields.security = 'WPA';
    content = { type, fields } as Content;
  }

  let style: Style | null = null;
  const present = (Object.keys(STYLE_KEYS) as QueryKey[]).filter((k) => q.has(k));
  if (present.length) {
    const raw: Record<string, unknown> = { ...(q.has('shape') ? DEFAULT_STYLE : saved) };
    for (const qk of present) raw[STYLE_KEYS[qk]] = decodeValue(STYLE_KEYS[qk], q.get(qk)!);
    // Anything malformed falls back to its default, field by field.
    style = sanitizeStyle(raw);
  }

  return { content, style };
}
