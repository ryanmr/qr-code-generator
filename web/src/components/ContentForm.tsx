import { Contact, Eye, EyeOff, Link2, Mail, MapPin, MessageSquare, Phone, Type, Wifi } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Switch } from '@/components/ui/switch';
import type { ContentType, Fields } from '@/lib/payload';
import { cn } from '@/lib/utils';

const TYPES: { value: ContentType; label: string; icon: typeof Link2 }[] = [
  { value: 'url', label: 'URL', icon: Link2 },
  { value: 'text', label: 'Text', icon: Type },
  { value: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'sms', label: 'SMS', icon: MessageSquare },
  { value: 'contact', label: 'Contact', icon: Contact },
  { value: 'location', label: 'Location', icon: MapPin },
];

function Field({ label, children, className }: { label: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
    </div>
  );
}

export function TypePicker({ value, onChange }: { value: ContentType; onChange: (t: ContentType) => void }) {
  return (
    <div role="radiogroup" aria-label="Content type" className="grid grid-cols-4 gap-1 sm:grid-cols-8">
      {TYPES.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn(
            'flex flex-col items-center gap-1 rounded-md border border-transparent px-1 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === v && 'border-border bg-accent text-foreground',
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

type Setter<K extends ContentType> = (patch: Partial<Fields[K]>) => void;

export function ContentForm<K extends ContentType>({
  type,
  fields,
  onChange,
}: {
  type: K;
  fields: Fields[K];
  onChange: Setter<K>;
}) {
  const [showPass, setShowPass] = useState(false);
  // TS cannot narrow a generic K through the switch, so fields are read
  // loosely here; the Fields type still governs what callers pass in and out.
  const f = fields as Record<string, unknown>;
  const set = onChange as (patch: Record<string, unknown>) => void;
  const text = (key: string) => ({
    value: String(f[key] ?? ''),
    onChange: (e: { target: { value: string } }) => set({ [key]: e.target.value }),
  });

  switch (type) {
    case 'url':
      return (
        <Field label="Link">
          {(id) => (
            <Input
              id={id}
              autoFocus
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="https://example.com"
              className="h-11 text-base"
              {...text('url')}
            />
          )}
        </Field>
      );
    case 'text':
      return (
        <Field label="Text">
          {(id) => <Textarea id={id} autoFocus rows={4} placeholder="Anything at all" {...text('text')} />}
        </Field>
      );
    case 'wifi':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Network name (SSID)">
            {(id) => <Input id={id} autoCapitalize="off" autoCorrect="off" spellCheck={false} {...text('ssid')} />}
          </Field>
          <Field label="Password">
            {(id) => (
              <div className="relative">
                <Input
                  id={id}
                  type={showPass ? 'text' : 'password'}
                  autoComplete="off"
                  disabled={f.security === 'nopass'}
                  className="pr-9"
                  {...text('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            )}
          </Field>
          <Field label="Security">
            {() => (
              <Segmented
                aria-label="Security"
                value={f.security as Fields['wifi']['security']}
                onChange={(v) => set({ security: v })}
                options={[
                  { value: 'WPA', label: 'WPA/WPA3' },
                  { value: 'WEP', label: 'WEP' },
                  { value: 'nopass', label: 'None' },
                ]}
              />
            )}
          </Field>
          <Field label="Hidden network">
            {(id) => (
              <div className="flex h-9 items-center">
                <Switch id={id} checked={Boolean(f.hidden)} onChange={(v) => set({ hidden: v })} />
              </div>
            )}
          </Field>
        </div>
      );
    case 'email':
      return (
        <div className="grid gap-3">
          <Field label="To">{(id) => <Input id={id} type="email" placeholder="someone@example.com" {...text('to')} />}</Field>
          <Field label="Subject">{(id) => <Input id={id} {...text('subject')} />}</Field>
          <Field label="Body">{(id) => <Textarea id={id} rows={3} {...text('body')} />}</Field>
        </div>
      );
    case 'phone':
      return (
        <Field label="Phone number">
          {(id) => <Input id={id} type="tel" placeholder="+1 555 123 4567" {...text('number')} />}
        </Field>
      );
    case 'sms':
      return (
        <div className="grid gap-3">
          <Field label="Phone number">{(id) => <Input id={id} type="tel" {...text('number')} />}</Field>
          <Field label="Message">{(id) => <Textarea id={id} rows={3} {...text('message')} />}</Field>
        </div>
      );
    case 'contact':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">{(id) => <Input id={id} autoComplete="off" {...text('name')} />}</Field>
          <Field label="Organisation">{(id) => <Input id={id} autoComplete="off" {...text('org')} />}</Field>
          <Field label="Phone">{(id) => <Input id={id} type="tel" autoComplete="off" {...text('phone')} />}</Field>
          <Field label="Email">{(id) => <Input id={id} type="email" autoComplete="off" {...text('email')} />}</Field>
          <Field label="Website" className="sm:col-span-2">
            {(id) => <Input id={id} inputMode="url" autoCapitalize="off" {...text('url')} />}
          </Field>
        </div>
      );
    case 'location':
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude">{(id) => <Input id={id} inputMode="decimal" placeholder="44.9778" {...text('lat')} />}</Field>
          <Field label="Longitude">{(id) => <Input id={id} inputMode="decimal" placeholder="-93.2650" {...text('lng')} />}</Field>
        </div>
      );
    default:
      return null;
  }
}
