import type { Encoded } from '@/lib/qr/encode';
import { alignmentCentres, alignmentPath, eyePath, modulePath, type Facing } from '@/lib/qr/shapes';
import type { Style } from '@/lib/style';

export interface Logo {
  /** A data: URL, read locally. Never uploaded anywhere. */
  href: string;
  /** Logo box width as a fraction of the code (not counting the quiet zone). */
  scale: number;
}

/** The largest logo that ECC H can reliably absorb: 0.3² ≈ 9% of the modules. */
export const MAX_LOGO_SCALE = 0.3;

export interface RenderOptions {
  logo?: Logo | null;
  /** Written as width/height attributes. Omit to let CSS size the preview. */
  width?: number;
  /** Prefix for gradient ids, so several inline SVGs on one page do not collide. */
  idPrefix?: string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * The square of modules cleared for a logo, snapped to whole modules and kept
 * the same parity as the code so it stays exactly centred.
 */
export function logoHole(size: number, scale: number): { start: number; count: number } {
  let count = Math.ceil(size * Math.min(scale, MAX_LOGO_SCALE));
  if (count % 2 !== size % 2) count += 1;
  return { start: (size - count) / 2, count };
}

/**
 * Draws a QR code as an SVG string. This is the only renderer: the preview
 * shows it inline, the SVG download is this string, and the PNG download is
 * this string rasterised, so all three always match.
 */
export function renderSvg(qr: Encoded, style: Style, opts: RenderOptions = {}): string {
  const { size, modules } = qr;
  const m = style.margin;
  const total = size + 2 * m;
  const id = opts.idPrefix ?? 'qr';

  // Finder and alignment patterns are drawn as whole shapes, so their modules
  // are skipped here and do not count as neighbours for the fused shapes.
  const inFinder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);

  const centres = alignmentCentres(qr.version);
  const last = centres.length - 1;
  // Every pairing except the three that would overlap a finder pattern.
  const aligns = centres.flatMap((cy, j) =>
    centres
      .filter((_, i) => !((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)))
      .map((cx) => [cx, cy] as const),
  );
  const inAlign = (x: number, y: number) => aligns.some(([cx, cy]) => Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2);

  const hole = opts.logo ? logoHole(size, opts.logo.scale) : null;
  const inHole = (x: number, y: number) =>
    hole !== null &&
    x >= hole.start &&
    x < hole.start + hole.count &&
    y >= hole.start &&
    y < hole.start + hole.count;

  const on = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < size && y < size && modules[y]![x]! && !inFinder(x, y) && !inAlign(x, y) && !inHole(x, y);

  let body = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!on(x, y)) continue;
      body += modulePath(style.moduleShape, x + m, y + m, {
        t: on(x, y - 1),
        r: on(x + 1, y),
        b: on(x, y + 1),
        l: on(x - 1, y),
      });
    }
  }

  const eyes: [number, number, Facing][] = [
    [m, m, 'br'],
    [m + size - 7, m, 'bl'],
    [m, m + size - 7, 'tr'],
  ];
  const eyeD =
    eyes.map(([x, y, f]) => eyePath(style.eyeFrame, style.eyeBall, x, y, f)).join('') +
    aligns
      // A logo can sit over the centre alignment pattern on mid-size versions.
      .filter(([cx, cy]) => !inHole(cx, cy))
      .map(([cx, cy]) => alignmentPath(style.eyeFrame, style.eyeBall, cx - 2 + m, cy - 2 + m))
      .join('');

  let defs = '';
  let fgFill = style.fg;
  if (style.gradient !== 'none') {
    const gid = `${id}-grad`;
    const stops = `<stop offset="0" stop-color="${style.fg}"/><stop offset="1" stop-color="${style.fg2}"/>`;
    const c = m + size / 2;
    if (style.gradient === 'linear') {
      // Long enough along the angle to reach the far corners of the code.
      const a = (style.gradientAngle * Math.PI) / 180;
      const half = (size / 2) * (Math.abs(Math.cos(a)) + Math.abs(Math.sin(a)));
      const dx = Math.cos(a) * half;
      const dy = Math.sin(a) * half;
      defs += `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${c - dx}" y1="${c - dy}" x2="${c + dx}" y2="${c + dy}">${stops}</linearGradient>`;
    } else {
      defs += `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${c}" cy="${c}" r="${(size / 2) * Math.SQRT2}">${stops}</radialGradient>`;
    }
    fgFill = `url(#${gid})`;
  }
  const eyeFill = style.eyeColor ?? fgFill;

  const parts: string[] = [];
  if (defs) parts.push(`<defs>${defs}</defs>`);
  if (!style.transparent) {
    const rx = ((style.cornerRadius / 100) * total) / 2;
    parts.push(`<rect width="${total}" height="${total}" rx="${rx}" fill="${style.bg}"/>`);
  }
  if (body) parts.push(`<path fill="${fgFill}" d="${body}"/>`);
  parts.push(`<path fill="${eyeFill}" fill-rule="evenodd" d="${eyeD}"/>`);
  if (opts.logo && hole) {
    // Inset half a module so the logo never touches the surrounding modules.
    const pad = 0.5;
    const x = m + hole.start + pad;
    const w = hole.count - 2 * pad;
    parts.push(
      `<image href="${esc(opts.logo.href)}" x="${x}" y="${x}" width="${w}" height="${w}" preserveAspectRatio="xMidYMid meet"/>`,
    );
  }

  const dims = opts.width ? ` width="${opts.width}" height="${opts.width}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}"${dims}>${parts.join('')}</svg>`;
}
