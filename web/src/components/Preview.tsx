import { AlertTriangle, Check, Copy, Download, FileCode2, Link2, Loader2, ScanLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ScanResult } from '@/lib/qr/scan-check';
import { cn } from '@/lib/utils';

export type ScanState = ScanResult | 'checking' | 'idle';

export function QrPreview({ svg, dim, message }: { svg: string; dim: boolean; message?: string }) {
  return (
    <div className="relative">
      <div
        // A checkerboard behind the code, so transparency and rounded corners show.
        className={cn(
          'aspect-square w-full overflow-hidden rounded-lg border bg-[repeating-conic-gradient(hsl(var(--muted))_0_25%,transparent_0_50%)] bg-[length:16px_16px] p-3 transition-opacity [&_svg]:size-full',
          dim && 'opacity-25',
        )}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {message && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <p className="rounded-md border bg-background/95 px-3 py-2 text-center text-sm shadow-sm">{message}</p>
        </div>
      )}
    </div>
  );
}

export function ScanBadge({ state }: { state: ScanState }) {
  if (state === 'idle') return null;
  const map = {
    checking: { icon: Loader2, text: 'Checking it scans…', cls: 'text-muted-foreground', spin: true },
    ok: { icon: ScanLine, text: 'Scans correctly', cls: 'text-emerald-600 dark:text-emerald-400', spin: false },
    mismatch: {
      icon: AlertTriangle,
      text: 'Scans, but reads back different text',
      cls: 'text-amber-600 dark:text-amber-400',
      spin: false,
    },
    unreadable: {
      icon: AlertTriangle,
      text: 'Could not read this code back. Try more contrast, a plainer shape or a smaller logo.',
      cls: 'text-amber-600 dark:text-amber-400',
      spin: false,
    },
  }[state];
  const Icon = map.icon;
  return (
    <p className={cn('flex items-start gap-1.5 text-xs', map.cls)}>
      <Icon className={cn('mt-px size-3.5 shrink-0', map.spin && 'animate-spin')} />
      {map.text}
    </p>
  );
}

/** Briefly swaps a button's label for a confirmation. */
function useFlash(): [string | null, (key: string) => void] {
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1500);
    return () => clearTimeout(t);
  }, [flash]);
  return [flash, setFlash];
}

export function DownloadBar({
  disabled,
  stem,
  onStem,
  pngName,
  svgName,
  onPng,
  onSvg,
  onCopyPng,
  onCopyLink,
}: {
  disabled: boolean;
  stem: string;
  onStem: (stem: string) => void;
  pngName: string;
  svgName: string;
  onPng: () => Promise<void>;
  onSvg: () => void;
  /** Absent where the browser cannot put images on the clipboard (e.g. plain http). */
  onCopyPng?: () => Promise<void>;
  onCopyLink: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useFlash();

  const run = async (key: string, fn: () => Promise<void> | void) => {
    setBusy(true);
    try {
      await fn();
      setFlash(key);
    } catch (e) {
      console.error(e);
      setFlash(`${key}-error`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="filename" className="text-xs font-medium text-muted-foreground">
          File name
        </label>
        <Input
          id="filename"
          value={stem}
          onChange={(e) => onStem(e.target.value)}
          spellCheck={false}
          className="font-mono text-xs"
        />
        <p className="truncate font-mono text-[11px] text-muted-foreground" title={`${pngName} / ${svgName}`}>
          {pngName}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button disabled={disabled || busy} onClick={() => run('png', onPng)}>
          {flash === 'png' ? <Check /> : <Download />} PNG
        </Button>
        <Button variant="outline" disabled={disabled || busy} onClick={() => run('svg', onSvg)}>
          {flash === 'svg' ? <Check /> : <FileCode2 />} SVG
        </Button>
        {onCopyPng && (
          <Button variant="outline" disabled={disabled || busy} onClick={() => run('copy', onCopyPng)}>
            {flash === 'copy' ? <Check /> : <Copy />} {flash === 'copy' ? 'Copied' : 'Copy image'}
          </Button>
        )}
        <Button
          variant="outline"
          disabled={disabled || busy}
          onClick={() => run('link', onCopyLink)}
          className={cn(!onCopyPng && 'col-span-2')}
          title="Copies a link that recreates this code, content and style included"
        >
          {flash === 'link' ? <Check /> : <Link2 />} {flash === 'link' ? 'Link copied' : 'Share link'}
        </Button>
      </div>
      {flash?.endsWith('-error') && <p className="text-xs text-destructive">That did not work. See the console.</p>}
    </div>
  );
}
