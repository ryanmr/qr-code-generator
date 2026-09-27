import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { Readable } from 'node:stream';
import type { MiddlewareHandler } from 'hono';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/**
 * Serves the built SPA, falling back to index.html so client-side routes such
 * as /about survive a refresh or a pasted link.
 */
export function serveSpa(dist: string): MiddlewareHandler {
  return async (c, next) => {
    if (c.req.path.startsWith('/api')) return next();

    // normalize() before join() so a crafted path cannot climb out of dist/.
    const requested = normalize(decodeURIComponent(c.req.path)).replace(/^(\.\.[/\\])+/, '');
    const candidate = join(dist, requested);
    const file =
      candidate.startsWith(dist) && existsSync(candidate) && statSync(candidate).isFile()
        ? candidate
        : join(dist, 'index.html');

    if (!existsSync(file)) return next();

    const type = TYPES[extname(file)] ?? 'application/octet-stream';
    // Hashed asset filenames are safe to cache hard; index.html must not be.
    const cache = file.endsWith('index.html')
      ? 'no-cache'
      : 'public, max-age=31536000, immutable';

    return c.body(Readable.toWeb(createReadStream(file)) as ReadableStream, 200, {
      'content-type': type,
      'cache-control': cache,
    });
  };
}
