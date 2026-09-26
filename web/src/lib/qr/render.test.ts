import { Resvg } from '@resvg/resvg-js';
import jsQR from 'jsqr';
import { describe, expect, it } from 'vitest';
import { encode, type Ecc } from '@/lib/qr/encode';
import { renderSvg, type Logo } from '@/lib/qr/render-svg';
import { BUILTIN_PRESETS, DEFAULT_STYLE, EYE_SHAPES, MODULE_SHAPES, type Style } from '@/lib/style';

/** Render → rasterise → decode, the same path a phone takes. */
function roundTrip(text: string, style: Style, logo?: Logo, ecc: Ecc = 'M'): string | null {
  const res = encode(text, { ecc, boostEcc: true, minVersion: 1, mask: -1 });
  if (!res.ok) throw new Error(res.error);
  const svg = renderSvg(res.qr, style, { logo, width: 600 });
  const img = new Resvg(svg, { background: '#ffffff' }).render();
  const decoded = jsQR(new Uint8ClampedArray(img.pixels), img.width, img.height, {
    inversionAttempts: 'dontInvert',
  });
  return decoded?.data ?? null;
}

const URL_TEXT = 'https://www.example.com/some/path?with=query&and=more';

describe('render round-trip', () => {
  for (const moduleShape of MODULE_SHAPES) {
    for (const eye of EYE_SHAPES) {
      it(`decodes ${moduleShape} modules with ${eye} eyes`, () => {
        const style = { ...DEFAULT_STYLE, moduleShape, eyeFrame: eye, eyeBall: eye };
        expect(roundTrip(URL_TEXT, style)).toBe(URL_TEXT);
      });
    }
  }

  for (const preset of BUILTIN_PRESETS) {
    it(`decodes the ${preset.name} preset`, () => {
      expect(roundTrip(URL_TEXT, { ...DEFAULT_STYLE, ...preset.look })).toBe(URL_TEXT);
    });
  }

  it('decodes with no quiet zone on a white matte', () => {
    expect(roundTrip(URL_TEXT, { ...DEFAULT_STYLE, margin: 0 })).toBe(URL_TEXT);
  });

  it('decodes UTF-8 text', () => {
    const text = 'Café ☕ — naïve 日本語';
    expect(roundTrip(text, DEFAULT_STYLE)).toBe(text);
  });

  it('decodes with a max-size logo hole at ECC H', () => {
    // A 1×1 transparent PNG: the hole itself is what is under test.
    const logo: Logo = {
      href: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      scale: 0.3,
    };
    expect(roundTrip(URL_TEXT, DEFAULT_STYLE, logo, 'H')).toBe(URL_TEXT);
  });
});

describe('encode', () => {
  it('reports a clear error when the text does not fit', () => {
    const res = encode('x'.repeat(3000), { ecc: 'H', boostEcc: false, minVersion: 1, mask: -1 });
    expect(res.ok).toBe(false);
  });

  it('boosts ECC when it fits in the same version', () => {
    const res = encode('hi', { ecc: 'L', boostEcc: true, minVersion: 1, mask: -1 });
    expect(res.ok && res.qr.ecc).toBe('H');
  });
});

describe('alignmentCentres', () => {
  it('matches the alignment patterns the encoder actually drew, v2–40', async () => {
    const { alignmentCentres } = await import('@/lib/qr/shapes');
    for (let v = 2; v <= 40; v++) {
      const res = encode('x', { ecc: 'L', boostEcc: false, minVersion: v, mask: 0 });
      if (!res.ok) throw new Error(res.error);
      const { modules, size } = res.qr;
      const c = alignmentCentres(v);
      expect(c.at(-1)).toBe(size - 7);
      // Check the bottom-right pattern on the diagonal: dark
      // centre, light ring one step out, dark ring two steps out.
      const p = c[c.length - 1]!;
      expect([modules[p]![p], modules[p]![p + 1], modules[p]![p + 2]]).toEqual([true, false, true]);
    }
  });
});
