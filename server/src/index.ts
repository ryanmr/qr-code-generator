import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import process from 'node:process';
import { config } from './config.js';
import { securityHeaders } from './headers.js';
import { serveSpa } from './static.js';

const app = new Hono();

// Safe to log every request: QR content never reaches the server. Share links
// carry it in the URL hash, which browsers do not send.
app.use('*', logger());
app.use('*', securityHeaders());
app.get('/api/health', (c) => c.json({ ok: true }));
app.use('*', serveSpa(config.webDist));
app.notFound((c) =>
  c.text(
    'Web UI has not been built yet. Run `npm run build --workspace=web`, ' +
      'or use the Vite dev server on port 5175.\n',
    404,
  ),
);

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`[startup] listening on http://localhost:${info.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
