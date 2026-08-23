// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://10bitlabs.co.uk',
  // Stylesheets stay external files rather than being inlined into <style> tags,
  // so the CSP never needs style-src 'unsafe-inline'.
  build: { inlineStylesheets: 'never' },
  // Keep every script an external file too, so the only inline script on the
  // site stays the blocking theme script the CSP admits by hash.
  vite: { build: { assetsInlineLimit: 0 } }
});
