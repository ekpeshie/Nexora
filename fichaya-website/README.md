# Fichaya Website

Marketing site for Fichaya, built from the **Fichaya Website** Figma file. Only the **Homepage** is built so far.

## Run it

```bash
cd fichaya-website
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck, build, then prerender the page to static HTML in dist/
npm run preview    # serve dist/
```

Set `SITE_URL` (e.g. `SITE_URL=https://fichaya.com npm run build`) to get the canonical link, absolute Open Graph image and `sitemap.xml`. On Vercel the production domain is used automatically.

## Structure

- `src/Home.tsx`: the page, made of one component per Figma section
- `src/components/`: Navbar (with the Services dropdown and mobile menu), Hero, Logos, ServicesShowcase (interactive service list), Outcomes, Metrics, Testimonials, Footer
- `src/data/content.ts`: all copy, links and asset references
- `src/styles/tokens.css`: colours, type scale, radii and spacing from the Figma variables
- `public/assets/`: images and SVGs exported from Figma. Photos are WebP at 800/1400/2752px for `srcset`
- `public/`: favicons (built from the "F" in the Fichaya logo), web manifest, Open Graph image
- `scripts/prerender.mjs`: renders the page to static HTML, inlines the CSS, adds canonical/Open Graph URLs and JSON-LD, writes `robots.txt` and `sitemap.xml`

## SEO and performance

- Prerendered HTML, so search engines and first paint get the full page before JavaScript loads; React then hydrates it.
- Title, description, Open Graph/Twitter cards, `ProfessionalService` structured data (address, phone, services).
- Self-hosted fonts (no Google Fonts round trip), inlined CSS, preloaded responsive hero image, lazy-loaded below-the-fold images.

## Notes

- Some brand colours fail WCAG contrast: white text on the yellow buttons, and the light grey eyebrow/metric text. They match the Figma file, so they are left as designed.
- Three services in the showcase (Generator & Power Management, Diesel Supply, Facility Consumables Supply) have no description in Figma yet, so they use placeholder copy in `content.ts`.
- The Figma file has two photos for the services showcase. The services alternate between them.
- There is only one testimonial in Figma. The slide indicator appears once there are two or more in `testimonials`.
- Nav and footer links point to in-page anchors until the other pages are built.
