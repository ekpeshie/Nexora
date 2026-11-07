# Fichaya Website

Marketing site for Fichaya, built from the **Fichaya Website** Figma file. Only the **Homepage** is built so far.

## Run it

```bash
cd fichaya-website
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
```

## Structure

- `src/Home.tsx`: the page, made of one component per Figma section
- `src/components/`: Navbar (with the Services dropdown and mobile menu), Hero, Logos, ServicesShowcase (interactive service list), Outcomes, Metrics, Testimonials, Footer
- `src/data/content.ts`: all copy, links and asset references
- `src/styles/tokens.css`: colours, type scale, radii and spacing from the Figma variables
- `public/assets/`: images and SVGs exported from Figma (photos resized to 2× display size)

## Notes

- Three services in the showcase (Generator & Power Management, Diesel Supply, Facility Consumables Supply) have no description in Figma yet, so they use placeholder copy in `content.ts`.
- The Figma file has two photos for the services showcase. The services alternate between them.
- There is only one testimonial in Figma. The slide indicator appears once there are two or more in `testimonials`.
- Nav and footer links point to in-page anchors until the other pages are built.
