import qrcodegen from './qrcodegen';

const { QrCode, QrSegment } = qrcodegen;

export type Ecc = 'L' | 'M' | 'Q' | 'H';

const ECC: Record<Ecc, qrcodegen.QrCode.Ecc> = {
  L: QrCode.Ecc.LOW,
  M: QrCode.Ecc.MEDIUM,
  Q: QrCode.Ecc.QUARTILE,
  H: QrCode.Ecc.HIGH,
};

const ECC_NAME = new Map<qrcodegen.QrCode.Ecc, Ecc>(
  (Object.entries(ECC) as [Ecc, qrcodegen.QrCode.Ecc][]).map(([k, v]) => [v, k]),
);

export interface EncodeOptions {
  ecc: Ecc;
  /** Raise ECC above `ecc` when the data still fits in the same version. */
  boostEcc: boolean;
  /** 1–40. The encoder picks the smallest version at or above this that fits. */
  minVersion: number;
  /** -1 lets the encoder choose the mask with the lowest penalty score. */
  mask: number;
}

export interface Encoded {
  /** `modules[y][x]`, true for dark. */
  modules: boolean[][];
  size: number;
  version: number;
  mask: number;
  /** The level actually used, which can exceed the requested one when boosted. */
  ecc: Ecc;
  /** Fraction of the version's data capacity this payload uses, 0–1. */
  fill: number;
}

export type EncodeResult = { ok: true; qr: Encoded } | { ok: false; error: string };

// Private upstream, but it is the only way to report how full the code is.
const numDataCodewords = (
  QrCode as unknown as { getNumDataCodewords(ver: number, ecl: qrcodegen.QrCode.Ecc): number }
).getNumDataCodewords;

export function encode(text: string, opts: EncodeOptions): EncodeResult {
  // makeSegments picks numeric or alphanumeric mode when the whole string
  // allows it (much denser than bytes), and UTF-8 bytes otherwise.
  const segs = QrSegment.makeSegments(text);
  let qr: qrcodegen.QrCode;
  try {
    qr = QrCode.encodeSegments(segs, ECC[opts.ecc], opts.minVersion, 40, opts.mask, opts.boostEcc);
  } catch {
    return {
      ok: false,
      error:
        opts.ecc === 'L'
          ? 'Too long to fit in a QR code. Shorten it.'
          : `Too long for error correction ${opts.ecc}. Try a lower level or shorten it.`,
    };
  }

  const modules: boolean[][] = [];
  for (let y = 0; y < qr.size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < qr.size; x++) row.push(qr.getModule(x, y));
    modules.push(row);
  }

  const used = QrSegment.getTotalBits(segs, qr.version);
  const capacity = numDataCodewords(qr.version, qr.errorCorrectionLevel) * 8;

  return {
    ok: true,
    qr: {
      modules,
      size: qr.size,
      version: qr.version,
      mask: qr.mask,
      ecc: ECC_NAME.get(qr.errorCorrectionLevel) ?? opts.ecc,
      fill: used / capacity,
    },
  };
}
