function loadSvg(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not rasterise the SVG'));
    };
    img.src = url;
  });
}

/**
 * Draws an SVG onto a canvas at `px` × `px`. Everything stays in the page:
 * the SVG goes in as a blob: URL and any embedded logo is already a data: URL.
 * `matte` paints a colour underneath first, for callers that need an opaque
 * image even when the design has a transparent background.
 */
export async function svgToCanvas(svg: string, px: number, matte?: string): Promise<HTMLCanvasElement> {
  const img = await loadSvg(svg);
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable');
  if (matte) {
    ctx.fillStyle = matte;
    ctx.fillRect(0, 0, px, px);
  }
  ctx.drawImage(img, 0, 0, px, px);
  return canvas;
}

export async function svgToPng(svg: string, px: number): Promise<Blob> {
  const canvas = await svgToCanvas(svg, px);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'),
  );
}
