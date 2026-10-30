/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
// base './' = relative URLs: works on GitHub Pages project sites (user.github.io/<repo>/) and any static host.
// test.include keeps Vitest away from the Playwright specs in e2e/ (they run with `npm run e2e`).
export default defineConfig({
  base: './',
  build: { target: 'es2020', rollupOptions: { input: { main: 'index.html', art: 'art.html' } } },
  test: { include: ['tests/**/*.test.ts'] },
});
