import jsQR from 'jsqr';
import { svgToCanvas } from '@/lib/qr/rasterize';

export type ScanResult = 'ok' | 'mismatch' | 'unreadable';

/**
 * Renders the code and reads it back with a real decoder, entirely in the
 * browser. Fancy shapes, gradients, low contrast and logos can each quietly
 * break scanning, and nothing short of decoding the actual pixels catches
 * every combination.
 *
 * Decoded over white, the way it would look printed or on most screens. A
 * light-on-transparent design is expected to fail here, which is correct.
 */
export async function scanCheck(svg: string, expected: string): Promise<ScanResult> {
  const px = 480;
  const canvas = await svgToCanvas(svg, px, '#ffffff');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'unreadable';
  const { data } = ctx.getImageData(0, 0, px, px);
  // Many phone scanners do try inverted codes, but plenty do not, so this
  // only passes codes that read the normal way round.
  const result = jsQR(data, px, px, { inversionAttempts: 'dontInvert' });
  if (!result) return 'unreadable';
  return result.data === expected ? 'ok' : 'mismatch';
}
