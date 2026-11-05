// Runs after `npm run build`: writes build/sitemap.xml and build/robots.txt.
// Both need absolute URLs, so they're generated from SITE_URL (or VITE_SITE_URL).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'build');
const PUBLIC_ROUTES = [
    { path: '/', priority: '1.0' },
    { path: '/play', priority: '0.9' },
    { path: '/leaderboard', priority: '0.7' },
    { path: '/puzzles', priority: '0.5' },
    { path: '/idea', priority: '0.8' },
    { path: '/team', priority: '0.6' },
];

function main() {
    if (!fs.existsSync(BUILD_DIR)) {
        console.error('generate-seo: build/ not found. Run `npm run build` first.');
        process.exit(1);
    }

    const raw = process.env.SITE_URL || process.env.VITE_SITE_URL || '';
    let siteUrl = '';
    if (raw) {
        try {
            const url = new URL(raw);
            if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
                console.warn(`generate-seo: SITE_URL should use https (got ${url.protocol}).`);
            }
            siteUrl = url.origin;
        } catch {
            console.error(`generate-seo: SITE_URL is not a valid URL: ${raw}`);
            process.exit(1);
        }
    }

    const robots = ['User-agent: *', 'Allow: /'];

    if (siteUrl) {
        const today = new Date().toISOString().slice(0, 10);
        const urls = PUBLIC_ROUTES.map(
            (r) =>
                `  <url>\n    <loc>${siteUrl}${r.path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${r.priority}</priority>\n  </url>`
        ).join('\n');
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
        fs.writeFileSync(path.join(BUILD_DIR, 'sitemap.xml'), sitemap);
        robots.push('', `Sitemap: ${siteUrl}/sitemap.xml`);
        console.log(`generate-seo: wrote sitemap.xml for ${siteUrl}`);
    } else {
        console.warn('generate-seo: SITE_URL not set, so sitemap.xml was skipped. Set it for production builds.');
    }

    fs.writeFileSync(path.join(BUILD_DIR, 'robots.txt'), robots.join('\n') + '\n');
}

main();
