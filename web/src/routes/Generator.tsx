import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ContentForm, TypePicker } from '@/components/ContentForm';
import { DownloadBar, QrPreview, ScanBadge, type ScanState } from '@/components/Preview';
import { StyleControls } from '@/components/StyleControls';
import { Switch } from '@/components/ui/switch';
import { downloadName, smartStem } from '@/lib/filename';
import { EMPTY_FIELDS, buildPayload, type Content, type ContentType, type Fields } from '@/lib/payload';
import { encode, type Encoded } from '@/lib/qr/encode';
import { svgToPng } from '@/lib/qr/rasterize';
import { renderSvg, type Logo } from '@/lib/qr/render-svg';
import { scanCheck } from '@/lib/qr/scan-check';
import { fromQuery, toQuery } from '@/lib/query';
import { readShareHash, sanitizeContent } from '@/lib/share';
import { KEYS, load, save } from '@/lib/storage';
import { DEFAULT_STYLE, pickLook, sanitizeStyle, type Preset, type Style } from '@/lib/style';

/** Shown faded while there is nothing to encode yet. */
const PLACEHOLDER = (() => {
  const r = encode('https://example.com', { ecc: 'M', boostEcc: true, minVersion: 1, mask: -1 });
  if (!r.ok) throw new Error(r.error);
  return r.qr;
})();

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  // Revoking straight away can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  // Plain-http LAN access has no async clipboard; fall back to the old way.
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  ta.remove();
  if (!ok) throw new Error('Clipboard unavailable');
}

const canCopyImage = typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write;

function loadPresets(): Preset[] {
  const raw = load<unknown>(KEYS.presets);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is { name: string; look: unknown } => typeof p?.name === 'string')
    .map((p) => ({ name: p.name.slice(0, 40), look: pickLook(sanitizeStyle(p.look)) }));
}

interface Initial {
  type: ContentType;
  fields: Fields;
  style: Style;
}

function initialState(): Initial {
  const fields: Fields = structuredClone(EMPTY_FIELDS);
  const seed = (content: Content) => {
    (fields as Record<ContentType, unknown>)[content.type] = content.fields;
  };
  const saved = sanitizeStyle(load(KEYS.style));

  const fromUrl = fromQuery(location.search, saved);
  if (fromUrl.content || fromUrl.style) {
    if (fromUrl.content) seed(fromUrl.content);
    return { type: fromUrl.content?.type ?? 'url', fields, style: fromUrl.style ?? saved };
  }

  const shared = readShareHash();
  if (shared) {
    seed(shared.content);
    return { type: shared.content.type, fields, style: shared.style };
  }

  const remembered = load<boolean>(KEYS.rememberContent) ? sanitizeContent(load(KEYS.content)) : null;
  if (remembered) {
    seed(remembered);
    return { type: remembered.type, fields, style: saved };
  }
  return { type: 'url', fields, style: saved };
}

export function Generator() {
  const [initial] = useState(initialState);
  const [type, setType] = useState<ContentType>(initial.type);
  // Every type keeps its own fields, so flipping between tabs loses nothing.
  const [fields, setFields] = useState<Fields>(initial.fields);
  const [style, setStyle] = useState<Style>(initial.style);
  const [logo, setLogo] = useState<Logo | null>(null);
  const [customPresets, setCustomPresets] = useState<Preset[]>(loadPresets);
  const [rememberContent, setRememberContent] = useState(() => load<boolean>(KEYS.rememberContent) ?? false);
  const [editedStem, setEditedStem] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanState>('idle');

  const content = useMemo(() => ({ type, fields: fields[type] }) as Content, [type, fields]);
  const payload = useMemo(() => buildPayload(content), [content]);

  const result = useMemo(
    () =>
      payload
        ? encode(payload, {
            // A logo knocks out modules, and only H has the redundancy to cover them.
            ecc: logo ? 'H' : style.ecc,
            boostEcc: style.boostEcc,
            minVersion: style.minVersion,
            mask: style.mask,
          })
        : null,
    [payload, logo, style.ecc, style.boostEcc, style.minVersion, style.mask],
  );

  // Keep the last good code on screen (faded) while the input is too long.
  const lastGood = useRef<Encoded | null>(null);
  if (result?.ok) lastGood.current = result.qr;
  const qr = result?.ok ? result.qr : null;
  const shown = qr ?? (result ? lastGood.current : null) ?? PLACEHOLDER;

  const previewSvg = useMemo(() => renderSvg(shown, style, { logo, idPrefix: 'preview' }), [shown, style, logo]);

  // Style is remembered per browser. Content only when asked to.
  useEffect(() => save(KEYS.style, style), [style]);
  useEffect(() => save(KEYS.presets, customPresets), [customPresets]);
  useEffect(() => {
    save(KEYS.rememberContent, rememberContent);
    save(KEYS.content, rememberContent ? content : null);
  }, [rememberContent, content]);

  // Keep the address bar describing the current code, so it can be copied or
  // bookmarked as-is. replaceState, not push: typing should not flood history.
  // Passing the existing state along keeps TanStack Router's history key.
  const query = useMemo(() => toQuery(content, style), [content, style]);
  useEffect(() => {
    history.replaceState(history.state, '', `${location.pathname}?${query}`);
  }, [query]);

  useEffect(() => {
    if (!qr) {
      setScan('idle');
      return;
    }
    setScan('checking');
    let cancelled = false;
    const t = setTimeout(() => {
      scanCheck(renderSvg(qr, style, { logo, idPrefix: 'scan' }), payload)
        .then((r) => !cancelled && setScan(r))
        .catch(() => !cancelled && setScan('idle'));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [qr, style, logo, payload]);

  const autoStem = useMemo(() => smartStem(content), [content]);
  const stem = editedStem ?? autoStem;
  const nameOpts = { size: style.size, defaultSize: DEFAULT_STYLE.size, edited: editedStem !== null };
  const pngName = downloadName(stem, 'png', nameOpts);
  const svgName = downloadName(stem, 'svg', nameOpts);

  const exportSvg = useCallback(
    () => (qr ? renderSvg(qr, style, { logo, width: style.size, idPrefix: 'qr' }) : ''),
    [qr, style, logo],
  );

  const patchStyle = useCallback((patch: Partial<Style>) => setStyle((s) => ({ ...s, ...patch })), []);
  const patchFields = useCallback(
    (patch: Partial<Fields[ContentType]>) =>
      setFields((f) => ({ ...f, [type]: { ...f[type], ...patch } })),
    [type],
  );

  let message: string | undefined;
  if (!payload) message = 'Type something to make a code';
  else if (result && !result.ok) message = result.error;

  return (
    // Phones stack input → preview → styling, so the code is in view right
    // under what you type. On desktop the preview spans both rows on the right
    // and stays put while the controls scroll.
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
      <section className="space-y-4 lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <QrPreview svg={previewSvg} dim={!qr} message={message} />
        <div className="flex min-h-5 flex-wrap items-center justify-between gap-x-3 gap-y-1">
          {qr ? (
            <p className="text-xs tabular-nums text-muted-foreground">
              v{qr.version} · {qr.size}×{qr.size} · ECC {qr.ecc} · {Math.round(qr.fill * 100)}% full
            </p>
          ) : (
            <span />
          )}
          <ScanBadge state={scan} />
        </div>
        <DownloadBar
          disabled={!qr}
          stem={stem}
          onStem={(s) => setEditedStem(s === autoStem ? null : s)}
          pngName={pngName}
          svgName={svgName}
          onPng={async () => downloadBlob(await svgToPng(exportSvg(), style.size), pngName)}
          onSvg={() => downloadBlob(new Blob([exportSvg()], { type: 'image/svg+xml' }), svgName)}
          onCopyPng={
            canCopyImage
              ? () =>
                  // Safari wants the promise handed over synchronously, inside the click.
                  navigator.clipboard.write([new ClipboardItem({ 'image/png': svgToPng(exportSvg(), style.size) })])
              : undefined
          }
          onCopyLink={() => copyText(`${location.origin}${location.pathname}?${query}`)}
        />
      </section>

      <section className="order-first min-w-0 lg:order-none lg:col-start-1 lg:row-start-1">
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <TypePicker value={type} onChange={setType} />
          <ContentForm type={type} fields={fields[type]} onChange={patchFields} />
          <details className="group text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none hover:text-foreground">Exact encoded text</summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-2 font-mono text-[11px] text-foreground">
              {payload || '(empty)'}
            </pre>
          </details>
          <label className="flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground">
            <span>Remember content in this browser</span>
            <Switch checked={rememberContent} onChange={setRememberContent} />
          </label>
        </div>
      </section>

      <section className="min-w-0 lg:col-start-1 lg:row-start-2">
        <StyleControls
          style={style}
          onStyle={patchStyle}
          logo={logo}
          onLogo={setLogo}
          customPresets={customPresets}
          onSavePreset={() => {
            const name = prompt('Name this preset', `Preset ${customPresets.length + 1}`)?.trim();
            if (name) setCustomPresets((p) => [...p, { name, look: pickLook(style) }]);
          }}
          onDeletePreset={(i) => setCustomPresets((p) => p.filter((_, j) => j !== i))}
        />
      </section>
    </div>
  );
}
