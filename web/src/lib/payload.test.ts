import { describe, expect, it } from 'vitest';
import { EMPTY_FIELDS, buildPayload, normalizeUrl } from '@/lib/payload';

describe('normalizeUrl', () => {
  it.each([
    ['example.com', 'https://example.com'],
    ['www.example.com/a?b=1', 'https://www.example.com/a?b=1'],
    ['localhost:3000', 'https://localhost:3000'],
    ['example.com:8080/x', 'https://example.com:8080/x'],
    ['http://example.com', 'http://example.com'],
    ['mailto:a@b.com', 'mailto:a@b.com'],
    ['otpauth://totp/x', 'otpauth://totp/x'],
    ['hello world', 'hello world'],
    ['  example.com  ', 'https://example.com'],
  ])('%s → %s', (input, out) => expect(normalizeUrl(input)).toBe(out));
});

describe('buildPayload', () => {
  it('escapes Wi-Fi fields', () => {
    expect(
      buildPayload({
        type: 'wifi',
        fields: { ...EMPTY_FIELDS.wifi, ssid: 'My;Net', password: 'p:a,s\\s"', hidden: true },
      }),
    ).toBe('WIFI:T:WPA;S:My\\;Net;P:p\\:a\\,s\\\\s\\";H:true;;');
  });

  it('omits the password for open networks', () => {
    expect(
      buildPayload({ type: 'wifi', fields: { ...EMPTY_FIELDS.wifi, ssid: 'Cafe', security: 'nopass', password: 'x' } }),
    ).toBe('WIFI:T:nopass;S:Cafe;;');
  });

  it('builds mailto with %20 spaces', () => {
    expect(
      buildPayload({ type: 'email', fields: { to: 'a@b.com', subject: 'Hi there', body: 'x&y' } }),
    ).toBe('mailto:a@b.com?subject=Hi%20there&body=x%26y');
  });

  it('builds a vCard', () => {
    expect(
      buildPayload({
        type: 'contact',
        fields: { ...EMPTY_FIELDS.contact, name: 'Ada King Lovelace', org: 'Analytical, Inc', phone: '+1 555' },
      }),
    ).toBe(
      'BEGIN:VCARD\nVERSION:3.0\nN:Lovelace;Ada King;;;\nFN:Ada King Lovelace\nORG:Analytical\\, Inc\nTEL:+1 555\nEND:VCARD',
    );
  });

  it('rejects out-of-range coordinates', () => {
    expect(buildPayload({ type: 'location', fields: { lat: '91', lng: '0' } })).toBe('');
    expect(buildPayload({ type: 'location', fields: { lat: '44.97', lng: '-93.26' } })).toBe('geo:44.97,-93.26');
  });

  it('is empty until there is something to encode', () => {
    expect(buildPayload({ type: 'wifi', fields: EMPTY_FIELDS.wifi })).toBe('');
    expect(buildPayload({ type: 'url', fields: { url: '   ' } })).toBe('');
  });
});
