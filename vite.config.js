import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Link previews need absolute URLs, so the site URL is written into index.html at build time.
const siteUrl = (process.env.VITE_SITE_URL || process.env.SITE_URL || '').replace(/\/$/, '');
const absoluteSiteUrls = {
  name: 'absolute-site-urls',
  transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
};

// The heading font decides when the largest text paints, so fetch it with the HTML.
const preloadHeadingFont = {
  name: 'preload-heading-font',
  transformIndexHtml: {
    order: 'post',
    handler(html, { bundle }) {
      const font = Object.keys(bundle || {}).find((file) => /space-grotesk-latin-700-normal.*\.woff2$/.test(file));
      if (!font) return html;
      return [
        {
          tag: 'link',
          attrs: { rel: 'preload', href: `/${font}`, as: 'font', type: 'font/woff2', crossorigin: '' },
          injectTo: 'head',
        },
      ];
    },
  },
};

export default defineConfig({
  plugins: [react(), absoluteSiteUrls, preloadHeadingFont],
  server: {
    port: 3000,
    // Same-origin /api calls in dev go to the Express API (replaces CRA's "proxy" field).
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  preview: {
    port: 3000,
  },
  build: {
    // Kept as build/ so `npm run serve`, serve.json and scripts/generate-seo.js work unchanged.
    outDir: 'build',
    // Fonts are always emitted as files: the CSP (font-src 'self') blocks data: URIs.
    assetsInlineLimit: (filePath) => (/\.woff2?$/.test(filePath) ? false : undefined),
  },
  test: {
    environment: 'node',
    // Only frontend tests; server/ has its own node:test suite.
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
