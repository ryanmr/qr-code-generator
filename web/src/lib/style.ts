import type { Ecc } from '@/lib/qr/encode';

export const MODULE_SHAPES = [
  'square',
  'rounded',
  'extra-rounded',
  'dots',
  'classy',
  'vertical',
  'horizontal',
  'diamond',
  'star',
] as const;
export type ModuleShape = (typeof MODULE_SHAPES)[number];

export const EYE_SHAPES = ['square', 'rounded', 'circle', 'leaf'] as const;
export type EyeShape = (typeof EYE_SHAPES)[number];

export type GradientKind = 'none' | 'linear' | 'radial';

export interface Style {
  moduleShape: ModuleShape;
  eyeFrame: EyeShape;
  eyeBall: EyeShape;

  fg: string;
  bg: string;
  /** null draws the eyes in the foreground colour (or gradient). */
  eyeColor: string | null;
  gradient: GradientKind;
  /** Second gradient stop; the first is `fg`. */
  fg2: string;
  /** Degrees, linear gradients only. 0 runs left to right. */
  gradientAngle: number;
  transparent: boolean;

  /** Quiet zone, in modules. The spec asks for 4. */
  margin: number;
  /** Background corner radius as a percentage of half the image, 0–100. */
  cornerRadius: number;

  ecc: Ecc;
  boostEcc: boolean;
  minVersion: number;
  mask: number;

  /** Output width and height in pixels for PNG. */
  size: number;
}

export const DEFAULT_STYLE: Style = {
  moduleShape: 'square',
  eyeFrame: 'square',
  eyeBall: 'square',
  fg: '#000000',
  bg: '#ffffff',
  eyeColor: null,
  gradient: 'none',
  fg2: '#2a78d6',
  gradientAngle: 45,
  transparent: false,
  margin: 4,
  cornerRadius: 0,
  ecc: 'M',
  boostEcc: true,
  minVersion: 1,
  mask: -1,
  size: 1024,
};

/** Only the look: presets never touch size, margin or error correction. */
export type Look = Pick<
  Style,
  | 'moduleShape'
  | 'eyeFrame'
  | 'eyeBall'
  | 'fg'
  | 'bg'
  | 'eyeColor'
  | 'gradient'
  | 'fg2'
  | 'gradientAngle'
  | 'cornerRadius'
>;

export interface Preset {
  name: string;
  look: Look;
}

const base: Look = {
  moduleShape: 'square',
  eyeFrame: 'square',
  eyeBall: 'square',
  fg: '#000000',
  bg: '#ffffff',
  eyeColor: null,
  gradient: 'none',
  fg2: '#2a78d6',
  gradientAngle: 45,
  cornerRadius: 0,
};

export const BUILTIN_PRESETS: Preset[] = [
  { name: 'Classic', look: base },
  {
    name: 'Rounded',
    look: { ...base, moduleShape: 'rounded', eyeFrame: 'rounded', eyeBall: 'rounded' },
  },
  {
    name: 'Dots',
    look: { ...base, moduleShape: 'dots', eyeFrame: 'circle', eyeBall: 'circle' },
  },
  {
    name: 'Soft card',
    look: {
      ...base,
      moduleShape: 'extra-rounded',
      eyeFrame: 'rounded',
      eyeBall: 'circle',
      fg: '#1e293b',
      bg: '#f1f5f9',
      cornerRadius: 16,
    },
  },
  {
    name: 'Ink',
    look: {
      ...base,
      moduleShape: 'classy',
      eyeFrame: 'leaf',
      eyeBall: 'leaf',
      fg: '#1e3a8a',
      eyeColor: '#0f172a',
    },
  },
  {
    name: 'Sunset',
    look: {
      ...base,
      moduleShape: 'rounded',
      eyeFrame: 'rounded',
      eyeBall: 'circle',
      fg: '#c2410c',
      fg2: '#7e22ce',
      gradient: 'linear',
      gradientAngle: 45,
      cornerRadius: 10,
    },
  },
  {
    name: 'Bars',
    look: { ...base, moduleShape: 'vertical', eyeFrame: 'rounded', eyeBall: 'square', fg: '#064e3b' },
  },
  {
    name: 'Starry',
    look: {
      ...base,
      moduleShape: 'star',
      eyeFrame: 'circle',
      eyeBall: 'circle',
      fg: '#1e1b4b',
      fg2: '#6d28d9',
      gradient: 'radial',
      bg: '#fefce8',
      cornerRadius: 12,
    },
  },
  {
    name: 'Ocean',
    look: {
      ...base,
      moduleShape: 'extra-rounded',
      eyeFrame: 'rounded',
      eyeBall: 'rounded',
      fg: '#0e7490',
      fg2: '#1e3a8a',
      gradient: 'linear',
      gradientAngle: 90,
      bg: '#f0f9ff',
      cornerRadius: 16,
    },
  },
  {
    name: 'Candy',
    look: {
      ...base,
      moduleShape: 'dots',
      eyeFrame: 'rounded',
      eyeBall: 'circle',
      fg: '#be185d',
      fg2: '#c2410c',
      gradient: 'linear',
      gradientAngle: 135,
      eyeColor: '#831843',
      bg: '#fff1f2',
      cornerRadius: 20,
    },
  },
  {
    name: 'Forest',
    look: {
      ...base,
      moduleShape: 'classy',
      eyeFrame: 'leaf',
      eyeBall: 'leaf',
      fg: '#14532d',
      fg2: '#3f6212',
      gradient: 'radial',
      bg: '#f7fee7',
      cornerRadius: 8,
    },
  },
];

/**
 * Colour-only themes: they change colours and gradients but leave shapes
 * alone. Every dark colour keeps at least 4.5:1 against its background
 * (enforced by a test), so none of them should cost scannability.
 */
export type ColorTheme = {
  name: string;
  colors: Pick<Style, 'fg' | 'fg2' | 'bg' | 'gradient' | 'gradientAngle' | 'eyeColor'>;
};

export const COLOR_THEMES: ColorTheme[] = [
  { name: 'Ink', colors: { fg: '#000000', fg2: '#000000', bg: '#ffffff', gradient: 'none', gradientAngle: 45, eyeColor: null } },
  { name: 'Sunset', colors: { fg: '#c2410c', fg2: '#7e22ce', bg: '#ffffff', gradient: 'linear', gradientAngle: 45, eyeColor: null } },
  { name: 'Ocean', colors: { fg: '#0e7490', fg2: '#1e3a8a', bg: '#f0f9ff', gradient: 'linear', gradientAngle: 90, eyeColor: null } },
  { name: 'Aurora', colors: { fg: '#047857', fg2: '#6d28d9', bg: '#ffffff', gradient: 'linear', gradientAngle: 135, eyeColor: null } },
  { name: 'Berry', colors: { fg: '#9d174d', fg2: '#4c1d95', bg: '#fdf2f8', gradient: 'radial', gradientAngle: 45, eyeColor: null } },
  { name: 'Ember', colors: { fg: '#991b1b', fg2: '#c2410c', bg: '#fffbeb', gradient: 'radial', gradientAngle: 45, eyeColor: '#7f1d1d' } },
  { name: 'Midnight', colors: { fg: '#1e1b4b', fg2: '#3730a3', bg: '#eef2ff', gradient: 'linear', gradientAngle: 90, eyeColor: '#0f172a' } },
  { name: 'Forest', colors: { fg: '#14532d', fg2: '#3f6212', bg: '#f7fee7', gradient: 'radial', gradientAngle: 45, eyeColor: null } },
  { name: 'Mono blue', colors: { fg: '#1d4ed8', fg2: '#1d4ed8', bg: '#ffffff', gradient: 'none', gradientAngle: 45, eyeColor: '#1e3a8a' } },
  { name: 'Slate', colors: { fg: '#334155', fg2: '#0f172a', bg: '#f8fafc', gradient: 'linear', gradientAngle: 90, eyeColor: null } },
];

export function matchesTheme(style: Style, t: ColorTheme): boolean {
  const c = t.colors;
  return (
    style.fg === c.fg &&
    style.bg === c.bg &&
    style.gradient === c.gradient &&
    style.eyeColor === c.eyeColor &&
    (c.gradient === 'none' || (style.fg2 === c.fg2 && (c.gradient === 'radial' || style.gradientAngle === c.gradientAngle)))
  );
}

export function pickLook(style: Style): Look {
  const {
    moduleShape,
    eyeFrame,
    eyeBall,
    fg,
    bg,
    eyeColor,
    gradient,
    fg2,
    gradientAngle,
    cornerRadius,
  } = style;
  return { moduleShape, eyeFrame, eyeBall, fg, bg, eyeColor, gradient, fg2, gradientAngle, cornerRadius };
}

export function sameLook(a: Look, b: Look): boolean {
  return (Object.keys(a) as (keyof Look)[]).every((k) => a[k] === b[k]);
}

/**
 * Parses anything that might be a Style (from localStorage or a share link)
 * field by field against the defaults, so a stale or hand-edited value can
 * never put the app in a state the controls cannot represent.
 */
export function sanitizeStyle(raw: unknown): Style {
  const out: Style = { ...DEFAULT_STYLE };
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;

  const oneOf = <T extends string>(v: unknown, allowed: readonly T[], d: T): T =>
    allowed.includes(v as T) ? (v as T) : d;
  const color = (v: unknown, d: string) =>
    typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : d;
  const num = (v: unknown, lo: number, hi: number, d: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : d;

  out.moduleShape = oneOf(r.moduleShape, MODULE_SHAPES, out.moduleShape);
  out.eyeFrame = oneOf(r.eyeFrame, EYE_SHAPES, out.eyeFrame);
  out.eyeBall = oneOf(r.eyeBall, EYE_SHAPES, out.eyeBall);
  out.fg = color(r.fg, out.fg);
  out.bg = color(r.bg, out.bg);
  out.eyeColor = r.eyeColor === null ? null : color(r.eyeColor, '') || null;
  out.gradient = oneOf(r.gradient, ['none', 'linear', 'radial'] as const, out.gradient);
  out.fg2 = color(r.fg2, out.fg2);
  out.gradientAngle = num(r.gradientAngle, 0, 359, out.gradientAngle);
  out.transparent = typeof r.transparent === 'boolean' ? r.transparent : out.transparent;
  out.margin = num(r.margin, 0, 8, out.margin);
  out.cornerRadius = num(r.cornerRadius, 0, 100, out.cornerRadius);
  out.ecc = oneOf(r.ecc, ['L', 'M', 'Q', 'H'] as const, out.ecc);
  out.boostEcc = typeof r.boostEcc === 'boolean' ? r.boostEcc : out.boostEcc;
  out.minVersion = num(r.minVersion, 1, 40, out.minVersion);
  out.mask = num(r.mask, -1, 7, out.mask);
  out.size = num(r.size, 64, 8192, out.size);
  return out;
}
