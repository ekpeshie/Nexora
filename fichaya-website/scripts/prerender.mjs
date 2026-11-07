// Runs after `vite build` + `vite build --ssr`: renders the homepage to static HTML and writes SEO files.
//
// Absolute URLs (canonical, og:url, og:image, sitemap) come from SITE_URL, e.g. SITE_URL=https://fichaya.com.
// On Vercel it falls back to the project's production domain. Without either, those tags are left out.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');

const rawSite =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
const site = rawSite.replace(/\/+$/, '');

const { render } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);
const appHtml = render();

const organization = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Fichaya',
  description:
    'Property operations partner for corporate and multi-tenant buildings: cleaning, maintenance, power, staffing and vendor coordination.',
  telephone: '+2348173602446',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Lekki Phase 1',
    addressLocality: 'Lekki',
    addressRegion: 'Lagos',
    postalCode: '101245',
    addressCountry: 'NG',
  },
  areaServed: { '@type': 'City', name: 'Lagos' },
  knowsAbout: [
    'Facility management',
    'Janitorial services',
    'Housekeeping',
    'AC servicing and maintenance',
    'Generator and power management',
    'Diesel supply',
    'Deep cleaning',
    'Fumigation',
    'Workforce recruitment',
  ],
  ...(site && { url: `${site}/`, logo: `${site}/icon-512.png`, image: `${site}/og-image.jpg` }),
};

const head = [
  ...(site
    ? [
        `<link rel="canonical" href="${site}/" />`,
        `<meta property="og:url" content="${site}/" />`,
        `<meta property="og:image" content="${site}/og-image.jpg" />`,
        `<meta name="twitter:image" content="${site}/og-image.jpg" />`,
      ]
    : [`<meta property="og:image" content="./og-image.jpg" />`]),
  `<script type="application/ld+json">${JSON.stringify(organization)}</script>`,
].join('\n    ');

const indexPath = path.join(dist, 'index.html');
const template = fs.readFileSync(indexPath, 'utf8');
if (!template.includes('<!--app-html-->')) throw new Error('index.html is missing the <!--app-html--> marker');
let html = template.replace('<!--seo-head-->', head).replace('<!--app-html-->', appHtml);

// Inline the stylesheet (~5 KB gzipped) so first paint doesn't wait for a second request.
// Its url()s are relative to dist/assets/, so rebase them onto the page.
html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+\.css)"[^>]*>/, (_, file) => {
  const css = fs
    .readFileSync(path.join(dist, 'assets', file), 'utf8')
    .replace(/url\((['"]?)\.\.\/assets\//g, 'url($1./assets/')
    .replace(/url\((['"]?)\.\/(?!assets\/)/g, 'url($1./assets/');
  return `<style>${css}</style>`;
});
fs.writeFileSync(indexPath, html);

fs.writeFileSync(
  path.join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n${site ? `\nSitemap: ${site}/sitemap.xml\n` : ''}`,
);
if (site) {
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    path.join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}/</loc><lastmod>${today}</lastmod></url>\n</urlset>\n`,
  );
}

fs.rmSync(ssrDir, { recursive: true, force: true });
console.log(`Prerendered index.html (${(appHtml.length / 1024).toFixed(1)} KiB of markup)${site ? ` for ${site}` : ' (no SITE_URL set)'}`);
