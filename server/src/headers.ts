import type { MiddlewareHandler } from 'hono';

/**
 * The whole point of this app is that what you type never leaves the browser.
 * Encoding happens client-side and the server has no endpoint that accepts
 * content, but that alone is a promise about our own code. The CSP turns it
 * into something the browser enforces: `connect-src 'none'` blocks every
 * fetch, XHR, WebSocket and beacon from the page, so not even a compromised
 * dependency can phone home. Everything else is locked to same-origin, with
 * `data:`/`blob:` images for the preview and downloads.
 *
 * Inline styles are allowed because the SVG preview and Base UI set style
 * attributes; inline scripts are not.
 *
 * The web build also writes this policy into index.html as a <meta> tag
 * (web/vite.config.ts), so static hosts such as GitHub Pages, which cannot set
 * headers, enforce it too. A <meta> policy ignores frame-ancestors, which is
 * why the header still matters where there is one.
 */
export const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
];

const CSP = CSP_DIRECTIVES.join('; ');

export function securityHeaders(): MiddlewareHandler {
  return async (c, next) => {
    await next();
    c.header('content-security-policy', CSP);
    c.header('referrer-policy', 'no-referrer');
    c.header('x-content-type-options', 'nosniff');
    c.header('permissions-policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  };
}
