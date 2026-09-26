import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import process from 'node:process';
import { config } from './config.js';
import { securityHeaders } from './headers.js';
import { serveSpa } from './static.js';

const app = new Hono();

// The page keeps QR content in the query string so URLs are shareable, so log
// the path only. Hono's built-in logger would write the full URL, content and
// Wi-Fi passwords included, into `docker logs`.
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  console.log(`${c.req.method} ${new URL(c.req.url).pathname} ${c.res.status} ${Date.now() - start}ms`);
});
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
