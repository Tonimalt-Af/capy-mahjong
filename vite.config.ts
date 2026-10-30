/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
/** Content-Security-Policy (meta: GitHub Pages can't send headers). Build only: the dev server needs inline HMR scripts/websockets.
 * No inline script is allowed; 'unsafe-inline' styles are needed for style="" attributes set from templates (positions, delays). */
export const CSP = ["default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self'", "connect-src 'self'", "media-src 'self'", "worker-src 'self'", "manifest-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'none'"].join('; ');
const csp = (): Plugin => ({ name: 'csp-meta', apply: 'build', transformIndexHtml: (html) => html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${CSP}"><meta name="referrer" content="strict-origin-when-cross-origin">`) });
/** Preloads for the home screen (build only, the font file name is content-hashed): the 700-weight Fredoka used by the logo
 * and buttons, and the home illustration (fetchpriority high: it is the largest thing on the first screen). */
const preloads = (): Plugin => ({ name: 'preloads', apply: 'build', transformIndexHtml: { order: 'post', handler: (html, ctx) => {
  if (!ctx.filename.endsWith('index.html') || !ctx.bundle) return html;
  const font = Object.keys(ctx.bundle).find((f) => /fredoka-latin-700-normal-[\w-]+\.woff2$/.test(f));
  const links = `${font ? `<link rel="preload" href="./${font}" as="font" type="font/woff2" crossorigin>` : ''}<link rel="preload" href="./home-bg.webp" as="image" type="image/webp" fetchpriority="high">`;
  return html.replace('</title>', `</title>\n${links}`);
} } });
// base './' = relative URLs: works on GitHub Pages project sites (user.github.io/<repo>/) and any static host.
// test.include keeps Vitest away from the Playwright specs in e2e/ (they run with `npm run e2e`).
export default defineConfig({
  base: './',
  plugins: [csp(), preloads()],
  build: { target: 'es2020', rollupOptions: { input: { main: 'index.html', art: 'art.html' } } },
  test: { include: ['tests/**/*.test.ts'] },
});
