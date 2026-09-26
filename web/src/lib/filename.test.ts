import { describe, expect, it } from 'vitest';
import { downloadName, slugify, smartStem } from '@/lib/filename';
import { EMPTY_FIELDS } from '@/lib/payload';

const date = new Date(2026, 8, 25, 21, 30);

describe('smartStem', () => {
  it('uses the host without www', () => {
    expect(smartStem({ type: 'url', fields: { url: 'https://www.example.com/a/b' } }, date)).toBe(
      'qr-code-example-com-2026-09-25',
    );
  });

  it('handles bare hosts', () => {
    expect(smartStem({ type: 'url', fields: { url: 'docs.github.com' } }, date)).toBe(
      'qr-code-docs-github-com-2026-09-25',
    );
  });

  it('uses the first words of text', () => {
    expect(smartStem({ type: 'text', fields: { text: 'Hello, World! This is a long note' } }, date)).toBe(
      'qr-code-hello-world-this-is-2026-09-25',
    );
  });

  it('names Wi-Fi codes by SSID', () => {
    expect(smartStem({ type: 'wifi', fields: { ...EMPTY_FIELDS.wifi, ssid: 'Home Net 5G' } }, date)).toBe(
      'qr-code-wifi-home-net-5g-2026-09-25',
    );
  });

  it('falls back to just the date', () => {
    expect(smartStem({ type: 'text', fields: { text: '' } }, date)).toBe('qr-code-2026-09-25');
  });
});

describe('downloadName', () => {
  it('adds a size suffix only for non-default PNGs', () => {
    expect(downloadName('qr-code-x', 'png', { size: 1024 })).toBe('qr-code-x.png');
    expect(downloadName('qr-code-x', 'png', { size: 2048 })).toBe('qr-code-x-2048px.png');
    expect(downloadName('qr-code-x', 'svg', { size: 2048 })).toBe('qr-code-x.svg');
    expect(downloadName('my name', 'png', { size: 2048, edited: true })).toBe('my name.png');
  });

  it('strips path characters and a typed extension', () => {
    expect(downloadName('a/b:c.png', 'png')).toBe('a-b-c.png');
    expect(downloadName('   ', 'svg')).toBe('qr-code.svg');
  });
});

describe('slugify', () => {
  it('folds accents and caps length at a word boundary', () => {
    expect(slugify('Café Crème')).toBe('cafe-creme');
    expect(slugify('one two three four five six seven eight nine ten', 20)).toBe('one-two-three-four');
  });
});
