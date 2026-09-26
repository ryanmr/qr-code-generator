import {
  Image as ImageIcon,
  Maximize,
  Palette,
  Plus,
  RotateCcw,
  ShieldCheck,
  Shapes,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Accordion, AccordionSection } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input, Label, inputClass } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { contrast, luminance } from '@/lib/color';
import { encode, type Ecc } from '@/lib/qr/encode';
import { MAX_LOGO_SCALE, renderSvg, type Logo } from '@/lib/qr/render-svg';
import { eyePath, modulePath } from '@/lib/qr/shapes';
import {
  BUILTIN_PRESETS,
  DEFAULT_STYLE,
  EYE_SHAPES,
  MODULE_SHAPES,
  pickLook,
  sameLook,
  type EyeShape,
  type Look,
  type ModuleShape,
  type Preset,
  type Style,
} from '@/lib/style';
import { cn } from '@/lib/utils';

export const SIZE_PRESETS = [256, 512, 1024, 2048, 4096] as const;

const MODULE_LABELS: Record<ModuleShape, string> = {
  square: 'Square',
  rounded: 'Rounded',
  'extra-rounded': 'Blob',
  dots: 'Dots',
  classy: 'Classy',
  vertical: 'Vertical',
  horizontal: 'Horizontal',
  diamond: 'Diamond',
};

const EYE_LABELS: Record<EyeShape, string> = {
  square: 'Square',
  rounded: 'Rounded',
  circle: 'Circle',
  leaf: 'Leaf',
};

const ECC_HELP: Record<Ecc, string> = {
  L: 'Recovers ~7% damage. Smallest code.',
  M: 'Recovers ~15%. A good default.',
  Q: 'Recovers ~25%. For print that may get scuffed.',
  H: 'Recovers ~30%. Needed under a logo.',
};

// ---------------------------------------------------------------- swatches

/** A fixed scrap of pattern that shows off how each module shape joins up. */
const SAMPLE = [
  [1, 1, 0, 1, 0],
  [1, 0, 0, 1, 1],
  [0, 1, 1, 1, 0],
  [1, 1, 0, 0, 1],
  [0, 1, 0, 1, 1],
];

function ModuleSwatch({ shape }: { shape: ModuleShape }) {
  const on = (x: number, y: number) => SAMPLE[y]?.[x] === 1;
  let d = '';
  SAMPLE.forEach((row, y) =>
    row.forEach((v, x) => {
      if (v) d += modulePath(shape, x, y, { t: on(x, y - 1), r: on(x + 1, y), b: on(x, y + 1), l: on(x - 1, y) });
    }),
  );
  return (
    <svg viewBox="-0.5 -0.5 6 6" className="size-full" aria-hidden>
      <path d={d} fill="currentColor" />
    </svg>
  );
}

function EyeSwatch({ frame, ball }: { frame: EyeShape; ball: EyeShape }) {
  return (
    <svg viewBox="-1 -1 9 9" className="size-full" aria-hidden>
      <path d={eyePath(frame, ball, 0, 0, 'br')} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

function Tile({
  selected,
  onClick,
  label,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      title={label}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-md border p-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected && 'border-primary bg-accent text-foreground',
        className,
      )}
    >
      {children}
      <span className="w-full truncate text-center">{label}</span>
    </button>
  );
}

/** Presets are previewed as a real (tiny, version 1) code. */
const PRESET_SAMPLE = (() => {
  const r = encode('QR', { ecc: 'L', boostEcc: false, minVersion: 1, mask: 0 });
  if (!r.ok) throw new Error(r.error);
  return r.qr;
})();

function PresetThumb({ look, id }: { look: Look; id: string }) {
  const svg = useMemo(
    () => renderSvg(PRESET_SAMPLE, { ...DEFAULT_STYLE, ...look, margin: 2 }, { idPrefix: id }),
    [look, id],
  );
  return <div className="size-12 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />;
}

// ---------------------------------------------------------------- fields

export function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn('space-y-1.5', disabled && 'opacity-50')}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1 [&::-moz-color-swatch]:rounded [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none"
        />
        <Input
          id={id}
          // Keyed on the value so an outside change (preset, picker) resets
          // whatever half-typed text was in the box.
          key={value}
          defaultValue={value}
          disabled={disabled}
          spellCheck={false}
          maxLength={7}
          className="font-mono uppercase"
          onChange={(e) => {
            const v = e.target.value.trim();
            const hex = v.startsWith('#') ? v : `#${v}`;
            if (/^#[0-9a-f]{6}$/i.test(hex)) onChange(hex.toLowerCase());
          }}
        />
      </div>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {value !== undefined && <span className="text-xs tabular-nums">{value}</span>}
      </div>
      {children}
    </div>
  );
}

function Warning({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------- controls

export interface StyleControlsProps {
  style: Style;
  onStyle: (patch: Partial<Style>) => void;
  logo: Logo | null;
  onLogo: (logo: Logo | null) => void;
  customPresets: Preset[];
  onSavePreset: () => void;
  onDeletePreset: (index: number) => void;
}

export function StyleControls({
  style,
  onStyle,
  logo,
  onLogo,
  customPresets,
  onSavePreset,
  onDeletePreset,
}: StyleControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const look = pickLook(style);
  const idBase = useId().replace(/:/g, '');

  const fgColors = style.gradient === 'none' ? [style.fg] : [style.fg, style.fg2];
  const darkColors = [...fgColors, ...(style.eyeColor ? [style.eyeColor] : [])];
  // Transparent codes are judged against white, the likeliest thing behind them.
  const bg = style.transparent ? '#ffffff' : style.bg;
  const worstContrast = Math.min(...darkColors.map((c) => contrast(c, bg)));
  const inverted = darkColors.some((c) => luminance(c) > luminance(bg));

  const [customPicked, setCustomPicked] = useState(false);
  const customSize = customPicked || !SIZE_PRESETS.includes(style.size as (typeof SIZE_PRESETS)[number]);

  function readLogo(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onLogo({ href: reader.result, scale: logo?.scale ?? 0.22 });
    };
    reader.readAsDataURL(file);
  }

  return (
    <Accordion defaultValue={['presets', 'shape']} multiple className="rounded-lg border bg-card px-4">
      <AccordionSection
        value="presets"
        title="Presets"
        icon={<Sparkles />}
        summary={
          [...BUILTIN_PRESETS, ...customPresets].find((p) => sameLook(p.look, look))?.name ?? 'Custom'
        }
      >
        <div role="radiogroup" aria-label="Presets" className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {BUILTIN_PRESETS.map((p, i) => (
            <Tile key={p.name} label={p.name} selected={sameLook(p.look, look)} onClick={() => onStyle(p.look)}>
              <PresetThumb look={p.look} id={`${idBase}-b${i}`} />
            </Tile>
          ))}
          {customPresets.map((p, i) => (
            <div key={`${p.name}-${i}`} className="group relative">
              <Tile
                label={p.name}
                selected={sameLook(p.look, look)}
                onClick={() => onStyle(p.look)}
                className="w-full"
              >
                <PresetThumb look={p.look} id={`${idBase}-c${i}`} />
              </Tile>
              <button
                type="button"
                aria-label={`Delete preset ${p.name}`}
                onClick={() => onDeletePreset(i)}
                className="absolute -right-1.5 -top-1.5 hidden size-5 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-destructive group-hover:flex group-focus-within:flex"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onSavePreset}
            className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed p-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Plus className="size-5" />
            Save current
          </button>
        </div>
      </AccordionSection>

      <AccordionSection
        value="shape"
        title="Shape"
        icon={<Shapes />}
        summary={`${MODULE_LABELS[style.moduleShape]} · ${EYE_LABELS[style.eyeFrame]} eyes`}
      >
        <Row label="Modules">
          <div role="radiogroup" aria-label="Module shape" className="grid grid-cols-4 gap-2">
            {MODULE_SHAPES.map((s) => (
              <Tile
                key={s}
                label={MODULE_LABELS[s]}
                selected={style.moduleShape === s}
                onClick={() => onStyle({ moduleShape: s })}
              >
                <div className="size-9">
                  <ModuleSwatch shape={s} />
                </div>
              </Tile>
            ))}
          </div>
        </Row>
        <div className="grid grid-cols-2 gap-4">
          <Row label="Eye frame">
            <div role="radiogroup" aria-label="Eye frame" className="grid grid-cols-2 gap-2">
              {EYE_SHAPES.map((s) => (
                <Tile key={s} label={EYE_LABELS[s]} selected={style.eyeFrame === s} onClick={() => onStyle({ eyeFrame: s })}>
                  <div className="size-8">
                    <EyeSwatch frame={s} ball={style.eyeBall} />
                  </div>
                </Tile>
              ))}
            </div>
          </Row>
          <Row label="Eye centre">
            <div role="radiogroup" aria-label="Eye centre" className="grid grid-cols-2 gap-2">
              {EYE_SHAPES.map((s) => (
                <Tile key={s} label={EYE_LABELS[s]} selected={style.eyeBall === s} onClick={() => onStyle({ eyeBall: s })}>
                  <div className="size-8">
                    <EyeSwatch frame={style.eyeFrame} ball={s} />
                  </div>
                </Tile>
              ))}
            </div>
          </Row>
        </div>
      </AccordionSection>

      <AccordionSection
        value="colors"
        title="Colours"
        icon={<Palette />}
        summary={
          <span className="inline-flex items-center gap-1">
            {[...fgColors, style.transparent ? null : style.bg].map((c, i) => (
              <span
                key={i}
                className={cn(
                  'inline-block size-3 rounded-sm border',
                  c === null && 'bg-[repeating-conic-gradient(#aaa_0_25%,#fff_0_50%)] bg-[length:6px_6px]',
                )}
                style={c ? { background: c } : undefined}
              />
            ))}
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Foreground" value={style.fg} onChange={(fg) => onStyle({ fg })} />
          <ColorField
            label="Background"
            value={style.bg}
            disabled={style.transparent}
            onChange={(bg) => onStyle({ bg })}
          />
        </div>
        <label className="flex items-center justify-between gap-3 text-sm">
          Transparent background
          <Switch checked={style.transparent} onChange={(transparent) => onStyle({ transparent })} />
        </label>

        <Row label="Gradient">
          <Segmented
            aria-label="Gradient"
            value={style.gradient}
            onChange={(gradient) => onStyle({ gradient })}
            options={[
              { value: 'none', label: 'Solid' },
              { value: 'linear', label: 'Linear' },
              { value: 'radial', label: 'Radial' },
            ]}
          />
        </Row>
        {style.gradient !== 'none' && (
          <div className="grid grid-cols-2 items-end gap-3">
            <ColorField label="Gradient end" value={style.fg2} onChange={(fg2) => onStyle({ fg2 })} />
            {style.gradient === 'linear' && (
              <Row label="Angle" value={`${style.gradientAngle}°`}>
                <div className="flex h-9 items-center">
                  <Slider
                    aria-label="Gradient angle"
                    min={0}
                    max={359}
                    value={style.gradientAngle}
                    onChange={(gradientAngle) => onStyle({ gradientAngle })}
                  />
                </div>
              </Row>
            )}
          </div>
        )}

        <label className="flex items-center justify-between gap-3 text-sm">
          Separate eye colour
          <Switch
            checked={style.eyeColor !== null}
            onChange={(on) => onStyle({ eyeColor: on ? style.fg : null })}
          />
        </label>
        {style.eyeColor !== null && (
          <ColorField label="Eyes" value={style.eyeColor} onChange={(eyeColor) => onStyle({ eyeColor })} />
        )}

        {inverted ? (
          <Warning>
            Light modules on a darker background. Many scanners cannot read inverted codes.
          </Warning>
        ) : (
          worstContrast < 4 && (
            <Warning>
              Low contrast ({worstContrast.toFixed(1)}:1). Aim for at least 4:1 so older phones can read it.
            </Warning>
          )
        )}
      </AccordionSection>

      <AccordionSection
        value="size"
        title="Size & padding"
        icon={<Maximize />}
        summary={`${style.size}px · ${style.margin === 0 ? 'no' : style.margin} padding`}
      >
        <Row label="Output size (PNG)" value={`${style.size} × ${style.size}px`}>
          <Segmented
            aria-label="Output size"
            value={customSize ? 'custom' : String(style.size)}
            onChange={(v) => {
              setCustomPicked(v === 'custom');
              if (v !== 'custom') onStyle({ size: Number(v) });
            }}
            options={[
              ...SIZE_PRESETS.map((s) => ({ value: String(s), label: s >= 1024 ? `${s / 1024}K` : String(s) })),
              { value: 'custom', label: 'Custom' },
            ]}
          />
          {customSize && (
            <Input
              type="number"
              min={64}
              max={8192}
              step={1}
              aria-label="Custom size in pixels"
              defaultValue={style.size}
              onBlur={(e) => {
                const v = Math.round(Number(e.target.value));
                onStyle({ size: Number.isFinite(v) ? Math.min(8192, Math.max(64, v)) : style.size });
              }}
            />
          )}
        </Row>

        <Row label="Padding (quiet zone)" value={style.margin === 0 ? 'None' : `${style.margin} modules`}>
          <div className="flex items-center gap-3">
            <Slider
              aria-label="Padding"
              min={0}
              max={8}
              value={style.margin}
              onChange={(margin) => onStyle({ margin })}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStyle({ margin: style.margin === 0 ? 4 : 0 })}
              className="w-24 shrink-0"
            >
              {style.margin === 0 ? 'Standard' : 'No padding'}
            </Button>
          </div>
          {style.margin < 2 && (
            <p className="text-xs text-muted-foreground">
              The spec asks for 4. Tight padding is fine if whatever it sits on is plain and light.
            </p>
          )}
        </Row>

        <Row label="Corner radius" value={style.cornerRadius === 0 ? 'Square' : `${style.cornerRadius}%`}>
          <Slider
            aria-label="Corner radius"
            min={0}
            max={100}
            value={style.cornerRadius}
            onChange={(cornerRadius) => onStyle({ cornerRadius })}
          />
          {style.transparent && (
            <p className="text-xs text-muted-foreground">Rounds the background, so it has no effect while that is transparent.</p>
          )}
          {!style.transparent && style.cornerRadius > 20 && style.margin < 3 && (
            <p className="text-xs text-muted-foreground">Rounded corners this large may clip the eyes. Add some padding.</p>
          )}
        </Row>
      </AccordionSection>

      <AccordionSection value="logo" title="Logo" icon={<ImageIcon />} summary={logo ? 'On' : 'None'}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readLogo(file);
            e.target.value = '';
          }}
        />
        {logo ? (
          <>
            <div className="flex items-center gap-3">
              <img src={logo.href} alt="" className="size-12 rounded border bg-[repeating-conic-gradient(#ddd_0_25%,#fff_0_50%)] bg-[length:10px_10px] object-contain p-1" />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload /> Replace
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onLogo(null)}>
                <Trash2 /> Remove
              </Button>
            </div>
            <Row label="Logo size" value={`${Math.round(logo.scale * 100)}%`}>
              <Slider
                aria-label="Logo size"
                min={10}
                max={MAX_LOGO_SCALE * 100}
                value={Math.round(logo.scale * 100)}
                onChange={(v) => onLogo({ ...logo, scale: v / 100 })}
              />
            </Row>
          </>
        ) : (
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full">
            <Upload /> Choose an image
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          The image is read in this browser only and never uploaded. A logo turns error correction up to H
          so the code survives the missing modules. It stays out of share links.
        </p>
      </AccordionSection>

      <AccordionSection
        value="ecc"
        title="Error correction"
        icon={<ShieldCheck />}
        summary={logo ? 'H (logo)' : style.ecc}
      >
        <Row label="Level">
          <Segmented
            aria-label="Error correction level"
            value={logo ? 'H' : style.ecc}
            onChange={(ecc) => onStyle({ ecc })}
            options={(['L', 'M', 'Q', 'H'] as const).map((l) => ({ value: l, label: l, title: ECC_HELP[l] }))}
          />
          <p className="text-xs text-muted-foreground">
            {logo ? 'Locked to H while a logo is set. ' : ''}
            {ECC_HELP[logo ? 'H' : style.ecc]} Higher levels make a denser code.
          </p>
        </Row>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>
            Boost when free
            <span className="block text-xs text-muted-foreground">
              Uses a higher level if the code stays the same size.
            </span>
          </span>
          <Switch checked={style.boostEcc} onChange={(boostEcc) => onStyle({ boostEcc })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Minimum version" value={style.minVersion === 1 ? 'Auto' : style.minVersion}>
            <div className="flex h-9 items-center">
              <Slider
                aria-label="Minimum version"
                min={1}
                max={40}
                value={style.minVersion}
                onChange={(minVersion) => onStyle({ minVersion })}
              />
            </div>
          </Row>
          <Row label="Mask pattern">
            <select
              aria-label="Mask pattern"
              value={style.mask}
              onChange={(e) => onStyle({ mask: Number(e.target.value) })}
              className={cn(inputClass, 'appearance-auto')}
            >
              <option value={-1}>Auto (best)</option>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((m) => (
                <option key={m} value={m}>
                  Mask {m}
                </option>
              ))}
            </select>
          </Row>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onStyle({
              ecc: DEFAULT_STYLE.ecc,
              boostEcc: DEFAULT_STYLE.boostEcc,
              minVersion: DEFAULT_STYLE.minVersion,
              mask: DEFAULT_STYLE.mask,
            })
          }
        >
          <RotateCcw /> Reset to defaults
        </Button>
      </AccordionSection>
    </Accordion>
  );
}
