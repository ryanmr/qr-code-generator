/// <reference types="vitest/config" />
import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite';
import { CSP_DIRECTIVES } from '../server/src/headers';

const API_TARGET = process.env.API_TARGET ?? 'http://localhost:8640';

/**
 * Build knobs, all optional:
 * - VITE_TARGET=static builds for a host with no server (GitHub Pages): adds
 *   404.html and about/index.html so deep links load, and lets the About page
 *   describe the host honestly.
 * - BASE_PATH serves the app from a subpath, e.g. /qr-code-generator/.
 * - SITE_URL is the public URL, used for absolute og:image and og:url links,
 *   which link previews require.
 */
const STATIC = process.env.VITE_TARGET === 'static';
const BASE = process.env.BASE_PATH ?? '/';
const SITE_URL = process.env.SITE_URL?.replace(/\/*$/, '/');

const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * Writes the CSP into the page as well as the server header, so the "no
 * network" promise holds on hosts that cannot set headers. Build only: the
 * Vite dev server needs a WebSocket for hot reload.
 */
function htmlMeta(): Plugin {
  const csp = CSP_DIRECTIVES.filter((d) => !d.startsWith('frame-ancestors')).join('; ');
  return {
    name: 'qr:html-meta',
    apply: 'build',
    transformIndexHtml() {
      const tags: HtmlTagDescriptor[] = [
        { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head-prepend' },
      ];
      if (SITE_URL) {
        tags.push(
          { tag: 'meta', attrs: { property: 'og:url', content: SITE_URL }, injectTo: 'head' },
          { tag: 'link', attrs: { rel: 'canonical', href: SITE_URL }, injectTo: 'head' },
        );
      }
      return tags;
    },
  };
}

/** og:image must be absolute for link previews; relative is the fallback. */
function ogImage(): Plugin {
  return {
    name: 'qr:og-image',
    transformIndexHtml: (html) => html.replaceAll('%OG_IMAGE%', escAttr(`${SITE_URL ?? BASE}og-image.png`)),
  };
}

/** Static hosts serve files, not routes, so give each route a file. */
function staticRoutes(outDir: string): Plugin {
  return {
    name: 'qr:static-routes',
    apply: 'build',
    closeBundle() {
      if (!STATIC) return;
      const index = path.join(outDir, 'index.html');
      copyFileSync(index, path.join(outDir, '404.html'));
      mkdirSync(path.join(outDir, 'about'), { recursive: true });
      copyFileSync(index, path.join(outDir, 'about', 'index.html'));
    },
  };
}

const OUT_DIR = path.resolve(import.meta.dirname, 'dist');

export default defineConfig({
  base: BASE,
  plugins: [react(), htmlMeta(), ogImage(), staticRoutes(OUT_DIR)],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    // Bound to all interfaces so a phone on the same network can reach the dev server.
    host: true,
    port: 5175,
    proxy: { '/api': { target: API_TARGET, changeOrigin: true } },
  },
  build: { outDir: OUT_DIR, sourcemap: false },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
