/**
 * Content types and the exact strings they encode to. What gets encoded is
 * always exactly what the fields say: no redirect, no short link, no tracking
 * wrapper.
 */

export const CONTENT_TYPES = ['url', 'text', 'wifi', 'email', 'phone', 'sms', 'contact', 'location'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export interface Fields {
  url: { url: string };
  text: { text: string };
  wifi: { ssid: string; password: string; security: 'WPA' | 'WEP' | 'nopass'; hidden: boolean };
  email: { to: string; subject: string; body: string };
  phone: { number: string };
  sms: { number: string; message: string };
  contact: { name: string; phone: string; email: string; org: string; url: string };
  location: { lat: string; lng: string };
}

export type Content = { [K in ContentType]: { type: K; fields: Fields[K] } }[ContentType];

export const EMPTY_FIELDS: Fields = {
  url: { url: '' },
  text: { text: '' },
  wifi: { ssid: '', password: '', security: 'WPA', hidden: false },
  email: { to: '', subject: '', body: '' },
  phone: { number: '' },
  sms: { number: '', message: '' },
  contact: { name: '', phone: '', email: '', org: '', url: '' },
  location: { lat: '', lng: '' },
};

/**
 * Adds https:// only when the input has no scheme and looks like a host
 * ("example.com/x", "localhost:3000"), so plain words and custom schemes
 * (mailto:, otpauth://) pass through untouched.
 */
export function normalizeUrl(raw: string): string {
  const s = raw.trim();
  // Anything with a scheme fails this (the colon is not followed by a port),
  // so only bare hosts, with an optional port and path, pick up https://.
  if (/^(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?([/?#]|$)/i.test(s)) return `https://${s}`;
  return s;
}

/** Wi-Fi fields escape \ ; , : and " with a backslash (ZXing's MECARD-style format). */
const wifiEscape = (s: string) => s.replace(/([\\;,:"])/g, '\\$1');

/** vCard 3.0 text values escape \ , ; and newlines. */
const vcardEscape = (s: string) => s.replace(/([\\,;])/g, '\\$1').replace(/\r?\n/g, '\\n');

export function buildPayload(content: Content): string {
  switch (content.type) {
    case 'url':
      return normalizeUrl(content.fields.url);
    case 'text':
      return content.fields.text;
    case 'wifi': {
      const f = content.fields;
      if (!f.ssid) return '';
      const parts = [`T:${f.security}`, `S:${wifiEscape(f.ssid)}`];
      if (f.security !== 'nopass') parts.push(`P:${wifiEscape(f.password)}`);
      if (f.hidden) parts.push('H:true');
      return `WIFI:${parts.join(';')};;`;
    }
    case 'email': {
      const f = content.fields;
      if (!f.to && !f.subject && !f.body) return '';
      const q = new URLSearchParams();
      if (f.subject) q.set('subject', f.subject);
      if (f.body) q.set('body', f.body);
      // URLSearchParams writes spaces as +, which mail clients show literally.
      const qs = q.toString().replace(/\+/g, '%20');
      return `mailto:${f.to.trim()}${qs ? `?${qs}` : ''}`;
    }
    case 'phone': {
      const num = content.fields.number.replace(/[^\d+*#]/g, '');
      return num ? `tel:${num}` : '';
    }
    case 'sms': {
      const f = content.fields;
      const num = f.number.replace(/[^\d+*#]/g, '');
      if (!num && !f.message) return '';
      return f.message ? `SMSTO:${num}:${f.message}` : `SMSTO:${num}`;
    }
    case 'contact': {
      const f = content.fields;
      if (!Object.values(f).some((v) => v.trim())) return '';
      const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
      const name = f.name.trim();
      if (name) {
        // N is required by 3.0 and wants "Last;First". Treat the last word as
        // the family name; it is a best guess, and FN keeps the name as typed.
        const words = name.split(/\s+/);
        const last = words.length > 1 ? words.pop()! : '';
        lines.push(`N:${vcardEscape(last)};${vcardEscape(words.join(' '))};;;`, `FN:${vcardEscape(name)}`);
      } else {
        lines.push('N:;;;;');
      }
      if (f.org.trim()) lines.push(`ORG:${vcardEscape(f.org.trim())}`);
      if (f.phone.trim()) lines.push(`TEL:${f.phone.trim()}`);
      if (f.email.trim()) lines.push(`EMAIL:${f.email.trim()}`);
      if (f.url.trim()) lines.push(`URL:${normalizeUrl(f.url)}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }
    case 'location': {
      const lat = Number(content.fields.lat);
      const lng = Number(content.fields.lng);
      if (content.fields.lat.trim() === '' || content.fields.lng.trim() === '') return '';
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return '';
      }
      return `geo:${lat},${lng}`;
    }
  }
}
