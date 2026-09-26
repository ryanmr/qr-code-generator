import { describe, expect, it } from 'vitest';
import { EMPTY_FIELDS, type Content } from '@/lib/payload';
import { fromQuery, toQuery } from '@/lib/query';
import { BUILTIN_PRESETS, DEFAULT_STYLE, type Style } from '@/lib/style';

describe('query round-trip', () => {
  const contents: Content[] = [
    { type: 'url', fields: { url: 'https://example.com/a?b=1&c=2#frag' } },
    { type: 'wifi', fields: { ...EMPTY_FIELDS.wifi, ssid: 'Home & Co', password: 'p@ss;word', hidden: true } },
    { type: 'contact', fields: { ...EMPTY_FIELDS.contact, name: 'Ada', url: 'ada.dev' } },
    { type: 'location', fields: { lat: '44.97', lng: '-93.26' } },
  ];
  for (const content of contents) {
    for (const preset of BUILTIN_PRESETS) {
      it(`${content.type} × ${preset.name}`, () => {
        const style: Style = { ...DEFAULT_STYLE, ...preset.look, size: 2048, margin: 0, ecc: 'Q', transparent: true };
        const back = fromQuery(toQuery(content, style));
        expect(back.content).toEqual(content);
        expect(back.style).toEqual(style);
      });
    }
  }
});

describe('fromQuery', () => {
  const saved: Style = { ...DEFAULT_STYLE, moduleShape: 'dots', fg: '#123456' };

  it('seeds the input and leaves the saved style alone', () => {
    const r = fromQuery('?url=example.com', saved);
    expect(r.content).toEqual({ type: 'url', fields: { url: 'example.com' } });
    expect(r.style).toBeNull();
  });

  it('lets loose style keys adjust the saved style', () => {
    expect(fromQuery('?size=2048', saved).style).toEqual({ ...saved, size: 2048 });
  });

  it('treats a URL with shape as a full style', () => {
    expect(fromQuery('?shape=star', saved).style).toEqual({ ...DEFAULT_STYLE, moduleShape: 'star' });
  });

  it('infers the type from its fields', () => {
    expect(fromQuery('?ssid=Cafe').content?.type).toBe('wifi');
    expect(fromQuery('?text=hello').content).toEqual({ type: 'text', fields: { text: 'hello' } });
  });

  it('falls back to defaults for junk values', () => {
    const s = fromQuery('?shape=hexagon&fg=zzz&margin=99&ecc=X').style!;
    expect(s.moduleShape).toBe('square');
    expect(s.fg).toBe(DEFAULT_STYLE.fg);
    expect(s.margin).toBe(8);
    expect(s.ecc).toBe('M');
  });

  it('leaves URLs readable', () => {
    expect(toQuery({ type: 'url', fields: { url: 'https://a.io/x?y=1' } }, DEFAULT_STYLE)).toBe(
      'url=https://a.io/x%3Fy%3D1&shape=square',
    );
  });

  it('keeps a plain link short', () => {
    expect(toQuery({ type: 'url', fields: { url: 'example.com' } }, DEFAULT_STYLE)).toBe('url=example.com&shape=square');
  });
});
