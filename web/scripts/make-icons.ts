/**
 * Regenerates the PNG icons and the social card in public/ from favicon.svg
 * and the app's own renderer. The outputs are committed; rerun after changing
 * the favicon or REPO_URL:
 *
 *   npm run icons --workspace=web
 *
 * The card's text uses a system font (DejaVu Sans or similar), so output can
 * differ slightly between machines.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { encode } from '@/lib/qr/encode';
import { renderSvg } from '@/lib/qr/render-svg';
import { REPO_URL } from '@/lib/project';
import { BUILTIN_PRESETS, DEFAULT_STYLE } from '@/lib/style';

const pub = path.resolve(import.meta.dirname, '../public');
const favicon = readFileSync(path.join(pub, 'favicon.svg'), 'utf8');

function png(svg: string, width: number, file: string) {
  const out = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: true, defaultFontFamily: 'DejaVu Sans' },
  }).render();
  writeFileSync(path.join(pub, file), out.asPng());
  console.log(`${file} ${out.width}×${out.height}`);
}

// Square, full-bleed versions of the favicon: iOS and Android add their own
// rounding, and a maskable icon must keep its glyph inside the middle 80%.
const glyph = favicon.match(/<g[\s\S]*<\/g>/)?.[0];
if (!glyph) throw new Error('favicon.svg has no <g> glyph');
const square = (scale: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#18181b"/>` +
  `<g transform="translate(16 16) scale(${scale}) translate(-16 -16)">${glyph}</g></svg>`;

png(favicon, 32, 'favicon-32.png');
png(square(0.85), 180, 'apple-touch-icon.png');
png(square(0.85), 192, 'icon-192.png');
png(square(0.85), 512, 'icon-512.png');
png(square(0.7), 512, 'icon-maskable-512.png');

// Social card: a real, scannable code for the repo, drawn by the app's renderer.
const res = encode(REPO_URL, { ecc: 'M', boostEcc: true, minVersion: 1, mask: -1 });
if (!res.ok) throw new Error(res.error);
const look = BUILTIN_PRESETS.find((p) => p.name === 'Sunset')?.look ?? {};
const code = renderSvg(res.qr, { ...DEFAULT_STYLE, ...look, margin: 3 }, { width: 420 });
const codeHref = `data:image/svg+xml;base64,${Buffer.from(code).toString('base64')}`;

const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#09090b"/>
  <image x="690" y="105" width="420" height="420" href="${codeHref}"/>
  <g font-family="DejaVu Sans, Liberation Sans, sans-serif" fill="#fafafa">
    <text x="90" y="230" font-size="68" font-weight="bold">QR Code</text>
    <text x="90" y="310" font-size="68" font-weight="bold">Generator</text>
    <g font-size="30" fill="#a1a1aa">
      <text x="90" y="390">Made in your browser.</text>
      <text x="90" y="435">No sign-up, no tracking redirects.</text>
      <text x="90" y="480">Nothing leaves the page.</text>
    </g>
  </g>
</svg>`;
png(card, 1200, 'og-image.png');
