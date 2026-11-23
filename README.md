# FBC website

The website of the **Founders and Builders Collective**, a student entrepreneurship community at BITS Pilani: co-founder matchmaking, member profiles and dashboards, AI-assisted onboarding, idea validation (with VistaDex), opportunities, events, a journal, resources, and an admin console.

**Live site:** https://magnumsolis.github.io/fbc-website/

Plain HTML, CSS and JavaScript (ES modules). No build step: edit a file, push, done.

**Taking over the project?** Start with **[HANDOFF.md](HANDOFF.md)**: status, architecture, go-live checklist, custom domain, scaling and backlog.

## Two modes
- **Demo** (default, `firebase: null` in `js/config.js`): fully clickable, data saved only in the visitor's browser. The first account you create in a browser is an admin, so you can explore the console.
- **Live**: Firebase Auth (Google, BITS accounts only) + Cloud Firestore. Follow **[SETUP.md](SETUP.md)** (about 20 minutes, free).

## Pages
`#home` · `#matchmaking` · `#validate` · `#opportunities` · `#events` · `#journal` (and `#journal-<post-id>`) · `#resources` · `#about` · `#contact` · `#join` · `#login` · `#onboarding` · `#dashboard` · `#admin`

## After changing CSS or JS
Run `npm run bump` (or `node tools/bump-version.mjs`) before pushing. It stamps a new `?v=` on every CSS/JS link so visitors' browsers fetch the new version instead of a cached one (GitHub Pages lets browsers cache files for 10 minutes).

## Code map
| File | What it does |
| --- | --- |
| `index.html` | Page shell: nav, footer, modal |
| `css/styles.css` | All styles. Design tokens at the top |
| `js/config.js` | Firebase config and default links. **The one file to edit to go live** |
| `js/content.js` | Option lists (domains, skills, stages…), roadmap, team, sample data |
| `js/db.js` | Data layer: demo engine (localStorage) and Firebase engine, one API |
| `js/app.js` | Router, public pages, sign-in, onboarding, member dashboard |
| `js/admin.js` | Admin console |
| `js/ai.js` | AI-assisted onboarding: the prompt and the reply parser |
| `js/ui.js` | Shared state and small helpers (escaping, dates, Markdown, CSV) |
| `firestore.rules` | Server-side security rules: who can read and write what |
| `tests/rules.test.mjs` | 20 tests for the security rules (`npm run test:rules`) |

## Design
One continuous warm-dark canvas with soft gold light, brand gold `#F2B630`, a code-built product preview in the hero, and a bento feature grid. Instrument Serif for headlines, Inter for text, IBM Plex Mono for labels. Liquid-glass surfaces (frosted, translucent cards over slowly drifting gold light) are used everywhere, and cards tilt toward the cursor on desktop. Gold is the only accent: hover, focus and active states use a slightly brighter gold (`#F5C04A`). The hero preview and feature tiles tilt toward the cursor on desktop.

Link previews use `assets/og.jpg` (1200×630). The `og:` tags in `index.html` point at the GitHub Pages address; update them if the site moves to a custom domain.
