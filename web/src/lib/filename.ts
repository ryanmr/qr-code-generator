import { normalizeUrl, type Content } from '@/lib/payload';

/** Lowercase ASCII words joined by dashes, capped so names stay readable. */
export function slugify(s: string, max = 40): string {
  const slug = s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length <= max) return slug;
  // Cut at a word boundary where there is one reasonably close to the limit.
  const cut = slug.slice(0, max);
  const dash = cut.lastIndexOf('-');
  return (dash > max / 2 ? cut.slice(0, dash) : cut).replace(/-+$/, '');
}

/** Local date, not UTC: a code made at 9 pm should not be dated tomorrow. */
export function localDate(d = new Date()): string {
  const p = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** The host without `www.`, or null when the text is not a parseable URL. */
function hostOf(raw: string): string | null {
  try {
    const u = new URL(normalizeUrl(raw));
    if (!u.hostname) return null;
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function subject(content: Content): string {
  switch (content.type) {
    case 'url': {
      const host = hostOf(content.fields.url);
      return host ? slugify(host) : slugify(content.fields.url.split(/\s+/).slice(0, 4).join(' '));
    }
    case 'text':
      return slugify(content.fields.text.trim().split(/\s+/).slice(0, 4).join(' '));
    case 'wifi':
      return ['wifi', slugify(content.fields.ssid)].filter(Boolean).join('-');
    case 'email':
      return ['email', slugify(content.fields.to.split('@')[0] ?? '')].filter(Boolean).join('-');
    case 'phone':
      return ['phone', content.fields.number.replace(/\D/g, '').slice(-4)].filter(Boolean).join('-');
    case 'sms':
      return ['sms', content.fields.number.replace(/\D/g, '').slice(-4)].filter(Boolean).join('-');
    case 'contact':
      return ['contact', slugify(content.fields.name || content.fields.org)].filter(Boolean).join('-');
    case 'location':
      return 'location';
  }
}

/** `qr-code-<subject>-<yyyy-mm-dd>`, the part of the name shown for editing. */
export function smartStem(content: Content, date?: Date): string {
  return ['qr-code', subject(content), localDate(date)].filter(Boolean).join('-');
}

/**
 * The saved file's name. PNGs made at a non-default size get a `-<size>px`
 * suffix so the everyday name stays short but different exports do not
 * overwrite each other. A name the user typed is used as-is.
 */
export function downloadName(
  stem: string,
  ext: 'png' | 'svg',
  opts: { size?: number; defaultSize?: number; edited?: boolean } = {},
): string {
  const clean = stem
    .trim()
    .replace(/\.(png|svg)$/i, '')
    .replace(/[/\\?%*:|"<>\x00-\x1f]/g, '-');
  const suffix =
    ext === 'png' && !opts.edited && opts.size && opts.size !== (opts.defaultSize ?? 1024)
      ? `-${opts.size}px`
      : '';
  return `${clean || 'qr-code'}${suffix}.${ext}`;
}
