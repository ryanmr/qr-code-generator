# qr-code-generator

A QR code generator that never sends what you type anywhere. Live preview,
styled modules and eyes, colours and gradients, logos, PNG/SVG export with
sensible file names. Served at `https://qr.internal.home.ifupdown.com` and
`http://192.168.1.133:8640`.

## Privacy model

- **Everything happens in the browser.** The server serves static files and
  `/api/health`, nothing else. There is no endpoint that takes QR content.
- **The browser enforces it.** `server/src/headers.ts` sends a CSP with
  `connect-src 'none'`, so the page cannot make any network request at all.
  If you add a feature that needs one, you are changing the premise of the app.
- **No third-party assets.** No CDNs, web fonts or analytics; Vite bundles everything.
- **Every code has a URL.** The address bar is kept in sync with readable
  query parameters (`web/src/lib/query.ts`), so it can be copied or bookmarked.
  The server logs paths only (a custom logger in `server/src/index.ts`;
  Hono's built-in one would log the query), and Traefik has no access log.
  Content, Wi-Fi passwords included, does end up in browser history.
  Logos are never included.
- **Storage:** style and saved presets in `localStorage`; content only if
  "Remember content" is on; logos in memory only.

## How it works

| Piece | File |
|---|---|
| Encoder | `web/src/lib/qr/qrcodegen.ts`: [Nayuki's library](https://github.com/nayuki/QR-Code-generator), vendored (MIT), pinned commit in the header |
| Wrapper | `web/src/lib/qr/encode.ts`: ECC, boost, min version, mask; reports version and fill |
| Renderer | `web/src/lib/qr/render-svg.ts` + `shapes.ts`: the one renderer; preview, SVG and PNG all come from it |
| PNG | `web/src/lib/qr/rasterize.ts`: SVG → canvas → blob |
| Scan check | `web/src/lib/qr/scan-check.ts`: decodes the rendered code with jsQR in the tab |
| Payloads | `web/src/lib/payload.ts`: URL, text, Wi-Fi, email, phone, SMS, vCard, geo |
| File names | `web/src/lib/filename.ts`: `qr-code-<subject>-<yyyy-mm-dd>[-<size>px].<ext>` |

Module shapes are neighbour-aware: a corner is only rounded where both sides
meeting at it are exposed, so runs fuse into blobs and bars. Finder **and
alignment** patterns are drawn as whole shapes in the eye style; leaving the
alignment pattern to the module shape made dot and diamond codes undecodable
from version 2 up.

## URL parameters

| Key | Meaning |
|---|---|
| `type` | `url` (default), `text`, `wifi`, `email`, `phone`, `sms`, `contact`, `location`. Inferred from the fields present if omitted |
| content fields | Same names as the form: `url`, `text`, `ssid`/`password`/`security`/`hidden`, `to`/`subject`/`body`, `number`/`message`, `name`/`phone`/`email`/`org`/`url`, `lat`/`lng` |
| `shape` | `square`, `rounded`, `extra-rounded`, `dots`, `classy`, `vertical`, `horizontal`, `diamond`, `star` |
| `frame`, `ball` | Eye frame / centre: `square`, `rounded`, `circle`, `leaf` |
| `fg`, `fg2`, `bg`, `eye` | Hex colours without `#`; `eye=none` follows the foreground |
| `gradient`, `angle` | `none`/`linear`/`radial`, degrees |
| `transparent`, `boost` | `1`/`0` |
| `margin`, `radius`, `size` | Modules 0–8, percent 0–100, pixels 64–8192 |
| `ecc`, `version`, `mask` | `L`/`M`/`Q`/`H`, 1–40, -1–7 |

`?url=example.com` just seeds the input and keeps your saved style; extra style
keys adjust it. A URL with `shape` (which the synced address bar always has)
describes the whole style, so missing keys mean the default. Old `#q=` share links still load.

## Development

```sh
npm install
npm run dev        # Hono on :8640, Vite on :5175
npm test           # vitest: payloads, file names, and render→rasterise→decode
                   # round-trips for every module × eye shape and preset
npm run typecheck
```

The round-trip tests use `@resvg/resvg-js` to rasterise and `jsqr` to decode.
If a new shape or preset fails them, it will fail on phones too.

## Deploy

```sh
docker compose up -d --build
```

Stateless, `read_only`, runs as `node`. Watchtower is disabled because the image is built locally.
