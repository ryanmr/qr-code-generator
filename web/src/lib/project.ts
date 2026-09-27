/** Where the source lives. The About page links here and the social card encodes it. */
export const REPO_URL = 'https://github.com/ryanmr/qr-code-generator';

/**
 * 'static' when built for a host with no server of ours (GitHub Pages), where
 * the host, not this app, decides what gets logged.
 */
export const STATIC_BUILD = import.meta.env.VITE_TARGET === 'static';
