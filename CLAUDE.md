# CLAUDE.md

Offline QR code generator. Read `README.md` first; it covers the architecture.

## Invariants

- **No network from the page.** The CSP in `server/src/headers.ts` has
  `connect-src 'none'`. Do not loosen it, add CDN assets, web fonts or
  analytics, or add a server endpoint that accepts QR content. The build also
  writes it into `index.html` as a `<meta>` tag (`web/vite.config.ts`) for
  static hosts, so it applies to both targets.
- **Two build targets.** `npm run build` for the container (Hono serves the
  SPA); `npm run build:static --workspace=web` for GitHub Pages
  (`.github/workflows/pages.yml`), with `BASE_PATH` for the subpath. Links and
  asset paths must respect `import.meta.env.BASE_URL`.
- **Public repo.** No secrets, hostnames beyond `docker-compose.yml`, or
  personal data in commits.
- **Query strings carry content, so never log them.** "Share link" writes the
  whole state into the URL (`web/src/lib/query.ts`); the address bar carries
  it only after that, or when a shared link was opened, until the next edit. The server's request logger prints
  the path only. Do not swap in `hono/logger`, which logs full URLs. Do not
  enable a Traefik access log for this router without dropping the query.
- **One renderer.** Preview, SVG and PNG all come from `renderSvg`. Do not add
  a second drawing path (e.g. canvas-native) or they will drift.
- **New shapes/presets must pass the round-trip tests** (`npm test`). They
  render, rasterise and decode every combination.
- `web/src/lib/qr/qrcodegen.ts` is vendored upstream. Do not edit it except for
  the header and trailing `export default`; bump the pinned commit if updating.

## Checks

```sh
npm test && npm run typecheck && npm run build
VITE_TARGET=static BASE_PATH=/qr-code-generator/ npm run build --workspace=web
docker compose config -q
```
