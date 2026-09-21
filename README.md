# WEBWORKS

Landing page / portfolio site for web development and business solutions — websites, online calculators, product configurators and order-automation tools for small and medium businesses across Europe.

Single static site, no build step, no framework — plain HTML/CSS/JS.

## Structure

```
index.html      Main page (markup only — styles and scripts are external)
css/style.css   All styles
js/script.js    Language switching, mobile nav, demo calculators, order-form demo
images/         Site images / screenshots (add real project photos here)
```

## Features

- **4 languages** (EN / PL / DE / RU) switched client-side, no reload — see the `TRANSLATIONS` object at the top of `js/script.js`. All page text is edited there, matched to the page via `data-i18n="key"` attributes.
- **Demo project mockups** — service calculator, booking widget, product configurator, order list, and a contact form with live validation (name / email format / phone with a real country-code picker), all client-side only.
- SEO basics wired in: Open Graph, Twitter Card, JSON-LD (`ProfessionalService`), canonical URL — search `REPLACE_WITH_YOUR_DOMAIN` in `index.html` once the site has a real domain.

## Local preview

Just open `index.html` in a browser — no server or build step required.

## To do before going live

- Replace `REPLACE_WITH_YOUR_DOMAIN` (canonical/OG/Twitter/JSON-LD tags) with the real domain.
- Add a real `og-image.jpg` (1200×630) for social link previews.
- Replace the GitHub contact link placeholder with a real profile URL.
- Add an Impressum / privacy policy page (required for advertising to a German audience).
