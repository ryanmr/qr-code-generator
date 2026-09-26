/**
 * SVG path builders, all in module units. Every closed shape is wound
 * clockwise so that neighbouring modules drawn into one `<path>` union cleanly
 * under the default nonzero fill rule, with no hairline seams between them.
 */
import type { EyeShape, ModuleShape } from '@/lib/style';

const n = (v: number) => String(Math.round(v * 1000) / 1000);

/** Corner radii, clockwise from top-left. */
export type Radii = [tl: number, tr: number, br: number, bl: number];

export function roundRect(x: number, y: number, w: number, h: number, [tl, tr, br, bl]: Radii): string {
  if (!tl && !tr && !br && !bl) return `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}z`;
  const arc = (r: number, dx: number, dy: number) => (r ? `a${n(r)} ${n(r)} 0 0 1 ${n(dx)} ${n(dy)}` : '');
  return (
    `M${n(x + tl)} ${n(y)}` +
    `h${n(w - tl - tr)}${arc(tr, tr, tr)}` +
    `v${n(h - tr - br)}${arc(br, -br, br)}` +
    `h${n(-(w - br - bl))}${arc(bl, -bl, -bl)}` +
    `v${n(-(h - bl - tl))}${arc(tl, tl, -tl)}z`
  );
}

export function circle(cx: number, cy: number, r: number): string {
  return `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 1 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 1 ${n(-2 * r)} 0z`;
}

/** A five-point star, wound clockwise from the top point. */
function star(cx: number, cy: number, outer: number, inner: number): string {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i === 0 ? 'M' : 'L'}${n(cx + r * Math.cos(a))} ${n(cy + r * Math.sin(a))}`;
  }
  return `${d}z`;
}

function diamond(cx: number, cy: number, r: number): string {
  return `M${n(cx)} ${n(cy - r)}L${n(cx + r)} ${n(cy)}L${n(cx)} ${n(cy + r)}L${n(cx - r)} ${n(cy)}z`;
}

/** Which orthogonal neighbours are also dark. */
export interface Neighbours {
  t: boolean;
  r: boolean;
  b: boolean;
  l: boolean;
}

/**
 * One dark module at (x, y). The neighbour-aware shapes only round a corner
 * where both sides meeting at it are exposed, so runs of modules fuse into
 * smooth blobs and bars instead of reading as a string of beads.
 */
export function modulePath(shape: ModuleShape, x: number, y: number, { t, r, b, l }: Neighbours): string {
  switch (shape) {
    case 'square':
      return roundRect(x, y, 1, 1, [0, 0, 0, 0]);
    case 'rounded':
    case 'extra-rounded': {
      const k = shape === 'rounded' ? 0.3 : 0.5;
      return roundRect(x, y, 1, 1, [!t && !l ? k : 0, !t && !r ? k : 0, !b && !r ? k : 0, !b && !l ? k : 0]);
    }
    case 'classy':
      return roundRect(x, y, 1, 1, [!t && !l ? 0.5 : 0, 0, !b && !r ? 0.5 : 0, 0]);
    case 'dots':
      return circle(x + 0.5, y + 0.5, 0.42);
    case 'diamond':
      return diamond(x + 0.5, y + 0.5, 0.52);
    case 'star':
      // A fat inner radius keeps enough ink at the centre, where decoders
      // sample, and the tips just reach the neighbouring modules.
      return star(x + 0.5, y + 0.55, 0.6, 0.3);
    case 'vertical': {
      const w = 0.76;
      const k = w / 2;
      return roundRect(x + (1 - w) / 2, y, w, 1, [!t ? k : 0, !t ? k : 0, !b ? k : 0, !b ? k : 0]);
    }
    case 'horizontal': {
      const h = 0.76;
      const k = h / 2;
      return roundRect(x, y + (1 - h) / 2, 1, h, [!l ? k : 0, !r ? k : 0, !r ? k : 0, !l ? k : 0]);
    }
  }
}

/** The corner of each finder pattern that points at the middle of the code. */
export type Facing = 'br' | 'bl' | 'tr';

function leafRadii(r: number, facing: Facing): Radii {
  return [r, facing === 'tr' ? 0 : r, facing === 'br' ? 0 : r, facing === 'bl' ? 0 : r];
}

/**
 * A finder pattern: a 7×7 ring with a 3×3 centre. Meant for a path with
 * `fill-rule="evenodd"`, which is what makes the inner outline a hole.
 */
export function eyePath(frame: EyeShape, ball: EyeShape, x: number, y: number, facing: Facing): string {
  let out = '';
  switch (frame) {
    case 'square':
      out += roundRect(x, y, 7, 7, [0, 0, 0, 0]) + roundRect(x + 1, y + 1, 5, 5, [0, 0, 0, 0]);
      break;
    case 'rounded':
      out += roundRect(x, y, 7, 7, [2, 2, 2, 2]) + roundRect(x + 1, y + 1, 5, 5, [1.2, 1.2, 1.2, 1.2]);
      break;
    case 'circle':
      out += circle(x + 3.5, y + 3.5, 3.5) + circle(x + 3.5, y + 3.5, 2.5);
      break;
    case 'leaf':
      out += roundRect(x, y, 7, 7, leafRadii(2.6, facing)) + roundRect(x + 1, y + 1, 5, 5, leafRadii(1.7, facing));
      break;
  }
  switch (ball) {
    case 'square':
      out += roundRect(x + 2, y + 2, 3, 3, [0, 0, 0, 0]);
      break;
    case 'rounded':
      out += roundRect(x + 2, y + 2, 3, 3, [0.9, 0.9, 0.9, 0.9]);
      break;
    case 'circle':
      out += circle(x + 3.5, y + 3.5, 1.5);
      break;
    case 'leaf':
      out += roundRect(x + 2, y + 2, 3, 3, leafRadii(1.2, facing));
      break;
  }
  return out;
}

/**
 * An alignment pattern: a 5×5 ring around a single module, drawn whole in the
 * eye style. Left to the module shape, dots and diamonds break it up enough
 * that decoders fail to lock on to it, and every version from 2 up has one.
 */
export function alignmentPath(frame: EyeShape, ball: EyeShape, x: number, y: number): string {
  let out = '';
  switch (frame) {
    case 'square':
      out += roundRect(x, y, 5, 5, [0, 0, 0, 0]) + roundRect(x + 1, y + 1, 3, 3, [0, 0, 0, 0]);
      break;
    case 'rounded':
    case 'leaf':
      out += roundRect(x, y, 5, 5, [1.4, 1.4, 1.4, 1.4]) + roundRect(x + 1, y + 1, 3, 3, [0.7, 0.7, 0.7, 0.7]);
      break;
    case 'circle':
      out += circle(x + 2.5, y + 2.5, 2.5) + circle(x + 2.5, y + 2.5, 1.5);
      break;
  }
  out +=
    ball === 'square' ? roundRect(x + 2, y + 2, 1, 1, [0, 0, 0, 0]) : circle(x + 2.5, y + 2.5, 0.5);
  return out;
}

/**
 * Centre coordinates of the alignment patterns along one axis (ISO 18004
 * Annex E), the same calculation as Nayuki's private helper.
 */
export function alignmentCentres(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const out = [6];
  for (let pos = version * 4 + 17 - 7; out.length < count; pos -= step) out.splice(1, 0, pos);
  return out;
}
