import path from 'node:path';
import process from 'node:process';

const here = path.dirname(new URL(import.meta.url).pathname);
/** dist/ and src/ both sit one level under server/, so this resolves either way. */
const serverRoot = path.resolve(here, '..');
const repoRoot = path.resolve(serverRoot, '..');

export const config = {
  port: Number(process.env.PORT ?? 8640),
  webDist: process.env.WEB_DIST ?? path.join(repoRoot, 'web', 'dist'),
} as const;
