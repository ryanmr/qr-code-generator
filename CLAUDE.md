# CLAUDE.md

Offline QR code generator. Read `README.md` first; it covers the architecture.

## Invariants

- **No network from the page.** The CSP in `server/src/headers.ts` has
  `connect-src 'none'`. Do not loosen it, add CDN assets, web fonts or
  analytics, or add a server endpoint that accepts QR content.
- **Never put content in the query string.** It ends up in Traefik/Hono logs.
  Share state goes in the hash (`web/src/lib/share.ts`).
- **One renderer.** Preview, SVG and PNG all come from `renderSvg`. Do not add
  a second drawing path (e.g. canvas-native) or they will drift.
- **New shapes/presets must pass the round-trip tests** (`npm test`). They
  render, rasterise and decode every combination.
- `web/src/lib/qr/qrcodegen.ts` is vendored upstream. Do not edit it except for
  the header and trailing `export default`; bump the pinned commit if updating.

## Checks

```sh
npm test && npm run typecheck && npm run build
docker compose config -q
```
