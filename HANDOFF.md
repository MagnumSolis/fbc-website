# FBC website: technical handoff

**For:** the FBC Technology & Platform team, and anyone who takes over the website.
**Goal:** take the site from "working prototype in demo mode" to a live, secure, scalable website on its own domain.
**Last updated:** 23 Nov 2026

---

## 1. Where things stand

The website is **built, tested and publicly hosted**, but it currently runs in **demo mode**: every visitor's data (accounts, profiles, applications) is saved only in their own browser. The backend code is finished. Going live means connecting a Firebase project, which takes about 20 minutes and costs nothing.

| Area | Status |
| --- | --- |
| Design and all pages | Done (liquid-glass dark theme, mobile-ready) |
| Public hosting | Done: GitHub Pages at https://magnumsolis.github.io/fbc-website/ |
| Backend code (sign-in, database, admin console) | Done, tested against local Firebase emulators |
| Security rules | Done, 20 automated tests passing |
| **Firebase project (live database + Google sign-in)** | **To do: section 6** |
| **Custom domain** | **To do: section 9** |
| Real content (events, ventures, posts, photos, quotes) | To do, via the admin console |
| Emails and notifications | Not built yet (needs Firebase's paid Blaze plan: section 10) |

## 2. Links and access

| What | Where |
| --- | --- |
| Live site | https://magnumsolis.github.io/fbc-website/ |
| Code (GitHub) | https://github.com/MagnumSolis/fbc-website (public) |
| Claude preview (same site) | https://claude.ai/artifact/Ltqga72tokJo4YgD9VkJ3A |
| Feature and design report | https://claude.ai/artifact/JCBmERWq71UpCnmyEndgCs |
| Setup guide in the repo | `SETUP.md` |

The repo currently lives under a personal GitHub account (MagnumSolis). **Recommended:** create an `fbc-bits` GitHub organisation, transfer the repo there (Settings → Transfer), and give core members access. Do the same for Firebase: create the project under a shared FBC Google account so access survives graduations.

## 3. How the site works

- **Plain HTML, CSS and JavaScript.** No framework, no build step. Edit a file, push, and it's live. JavaScript is split into ES modules.
- **Single-page app with hash routes** (`#matchmaking`, `#dashboard`, `#journal-<id>`…). `index.html` is the shell; `js/app.js` renders pages into it.
- **One data API, two engines** (`js/db.js`):
  - **Demo engine:** localStorage, seeded with sample data. Used when `js/config.js` has `firebase: null` (today).
  - **Firebase engine:** Firebase Authentication (Google sign-in) plus Cloud Firestore. Used as soon as a Firebase config is pasted into `js/config.js`. The Firebase SDK (v13.4.0) loads from Google's CDN only in this mode.
- **Security lives on the server.** Anyone can read and change the website's JavaScript, so it can't be trusted. `firestore.rules` runs on Google's servers and decides who can read or write each piece of data.

```
Browser (GitHub Pages)                         Google Firebase (free Spark plan)
 index.html + css/ + js/   ── Google sign-in ──▶ Firebase Authentication (BITS emails only)
       │                    ── reads/writes ──▶ Cloud Firestore  ◀── firestore.rules (server-side checks)
       └─ js/db.js picks demo (localStorage) or Firebase based on js/config.js
```

## 4. Code map

| File | What it does |
| --- | --- |
| `index.html` | Page shell: nav, footer, modal, link-preview (Open Graph) tags |
| `css/styles.css` | All styling. Design tokens at the top; the liquid-glass system near the end |
| `js/config.js` | **The one file to edit to go live:** Firebase config, allowed email pattern, default links |
| `js/content.js` | Option lists (domains, skills, stages…), roadmap, team, sample/seed data |
| `js/db.js` | Data layer: demo and Firebase engines behind one API |
| `js/app.js` | Router, public pages, sign-in, onboarding, member dashboard, animations |
| `js/admin.js` | Admin console (`#admin`) |
| `js/ai.js` | AI-assisted onboarding: the prompt and the reply parser |
| `js/ui.js` | Shared state and helpers: escaping, dates, Markdown, CSV export, icons |
| `firestore.rules` | Server-side security rules |
| `tests/rules.test.mjs` | 20 security-rule tests |
| `tools/bump-version.mjs` | Cache-busting (see section 8) |
| `firebase.json`, `.firebaserc`, `firestore.indexes.json` | Firebase CLI config |
| `assets/` | Logo, banner, favicon, home-screen icon, link-preview image (`og.jpg`) |

## 5. Run it locally

```bash
git clone https://github.com/MagnumSolis/fbc-website && cd fbc-website
python3 -m http.server 8000        # open http://localhost:8000  (demo mode)
```
For backend work and tests (needs Node 18+ and Java 11+ for the emulators):
```bash
npm install
npm run test:rules                 # runs the 20 security-rule tests against the Firestore emulator
npm run emulators                  # local Auth + Firestore; with a config in js/config.js, open http://localhost:8000/?emulator=1
```
Demo-mode tips: the first account created in a browser becomes admin, so you can explore `#admin`. To reset, use Admin → Settings → Reset demo data, or clear the site's storage.

## 6. Go-live checklist: Firebase (about 20 minutes, free)

Full step-by-step instructions are in `SETUP.md`. Summary:

1. **Create the project** at console.firebase.google.com under a shared FBC Google account. Add a **Web app** and copy its config into `js/config.js` (replace `firebase: null`). The config is safe to commit; it only identifies the project.
2. **Turn on Google sign-in:** Authentication → Sign-in method → Google → Enable. Under Authentication → Settings → **Authorised domains**, add `magnumsolis.github.io` and later your custom domain.
3. **Create Firestore:** Firestore Database → Create → location **asia-south1 (Mumbai)** or **asia-south2 (Delhi)** (this can't be changed later) → production mode.
4. **Publish the rules:** paste `firestore.rules` into Firestore → Rules → Publish, or run `npx firebase login`, `npx firebase use --add`, then `npm run deploy:rules`.
5. **First admin:** Firestore → start collection `admins` → document ID = your BITS email in lower case → add a field `email` with the same value.
6. **Ship:** run `npm run bump`, commit, push. GitHub Pages redeploys in about a minute.
7. **Seed and configure:** sign in on the live site, then go to Admin → Settings: load sample content (optional), paste the VistaDex link, and set the WhatsApp and join-form links.
8. **Smoke test** with two accounts: a founder lists a venture, a builder applies, the founder accepts, both RSVP to an event, a contact message arrives in Admin → Inbox. Also test the Google sign-in pop-up on desktop and phone; it couldn't be tested from the build environment.

## 7. Data model and security

Firestore collections (enforced by `firestore.rules`):

| Collection | Contents | Who can read | Who can write |
| --- | --- | --- | --- |
| `users/{uid}` | Profile: name, role, year, bio, skills, domains, venture fields | Signed-in BITS members | Only that member (email must match their Google account) |
| `users/{uid}/rsvps/{eventId}` | The member's RSVPs | Member, admins | Member |
| `ventures/{founderUid}` | One listing per founder | Everyone if live; founder; admins | Founder (can pause, can't un-hide); admins |
| `applications/{ventureId_uid}` | Builder → venture applications | Applicant, that founder, admins | Applicant creates (status must be "new"); founder changes status only |
| `events/{id}` and `events/{id}/rsvps/{uid}` | Events and attendees | Public if published; attendees visible to admins | Admins; members RSVP for themselves |
| `opportunities`, `posts`, `resources` | Site content | Public if live/published | Admins |
| `messages/{id}` | Contact form, newsletter, opportunity interest and submissions | Admins | Anyone (field and size limits) |
| `ideaChecks/{id}` | Saved idea-check results | That member | That member |
| `settings/site` | Links, announcement bar, VistaDex copy | Public | Admins |
| `admins/{email}` | Admin list | Admins (and you, for your own entry) | Admins |

Rules guarantee, among other things: only verified `*.bits-pilani.ac.in` Google accounts (all campuses) can sign in to member features; nobody can edit someone else's data or pose as another email; applications can't be faked or self-accepted; admins can hide ventures and founders can't undo that; only admins read the inbox. **Re-run `npm run test:rules` after any rules change**, then publish the rules.

## 8. Deploying changes

- **Hosting today:** GitHub Pages, deploying from `main` at the repo root. Every push to `main` goes live in about a minute (check the repo's Actions tab).
- **Before every push that changes CSS or JS, run `npm run bump`.** It stamps a new `?v=` on every CSS/JS link. Without it, visitors can see the old version for up to 10 minutes, and old and new modules can mix.
- **Workflow:** work on a branch, open a pull request, have someone review, then merge to `main`. Keep `main` deployable.
- **Rules deploy separately:** `npm run deploy:rules`. GitHub Pages doesn't touch Firebase.

## 9. Custom domain

1. **Buy a domain**, for example `fbcbits.in` or `fbc.club`, from Namecheap, GoDaddy, Cloudflare Registrar or similar. Check the GitHub Student Developer Pack for free-domain offers.
2. **GitHub:** repo → Settings → Pages → Custom domain → enter `www.yourdomain` → Save. This creates a `CNAME` file in the repo; keep it.
3. **DNS at your registrar:**
   - `www` → **CNAME** → `magnumsolis.github.io` (or `fbc-bits.github.io` after moving to an org)
   - Apex domain (`yourdomain`) → **A** records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
4. Wait for DNS (minutes to a few hours), then tick **Enforce HTTPS** in Pages settings.
5. **Update the domain in three places:** Firebase → Authentication → Authorised domains; the `og:url` and `og:image` tags in `index.html`; and the links in `README.md` and this file.

**Alternatives** if you outgrow GitHub Pages: **Cloudflare Pages** (free, unlimited bandwidth, preview links for every pull request) or **Firebase Hosting** (free tier, same console as the database). The site is static files, so moving takes about 15 minutes.

## 10. Scaling and costs

**Free (Spark plan) limits:** Firestore allows 50,000 document reads and 20,000 writes a day, with 1 GiB stored. Google sign-in has no cap, unless you opt into the Identity Platform upgrade, which caps free use at 3,000 daily active users. A visit reads roughly 10–40 documents, so that's very roughly 1,500–5,000 visits a day. Watch usage in Firebase console → Usage and billing.

**When to move to Blaze (pay as you go):** when daily usage nears the limits, or when you need any of the features below. The free amounts still apply on Blaze; you pay only above them. **Set a budget alert** (for example ₹500/month) in Google Cloud Billing the day you switch. Blaze unlocks:
- **Cloud Functions:** emails ("someone applied to your venture", event reminders, newsletter sending), applicant counters, scheduled clean-up.
- **Cloud Storage:** profile photos, venture logos, file uploads. Storage needs Blaze even for small usage since February 2026.
- **App Check:** stops bots spamming the contact form and newsletter.

**Performance notes:** Firestore's offline cache is on, so repeat visits read less. All queries are single-field, so no composite indexes are needed yet. The glass blur is lighter on phones. If pages grow large, add pagination to the admin tables first.

## 11. Backlog (suggested order)

1. **Go live** (sections 6 and 9) and load real content: events, opportunities, posts, the real VistaDex link.
2. **Real photos and member quotes** on the home page; replace the illustrative names in the hero preview with real ventures.
3. **Emails** via Cloud Functions and a mail provider: applicant notifications, status updates, event reminders, newsletter.
4. **App Check** plus rate limits on `messages`.
5. **Uploads:** venture logos and profile photos (Storage).
6. **Public applicant counts** on ventures (Cloud Function counter).
7. **SEO and sharing:** hash routes mean search engines mostly see the home page; consider pre-rendered pages for journal posts, or a move to a framework (Astro/Next.js) if SEO matters.
8. **Analytics:** privacy-friendly page analytics, plus an admin overview chart.
9. **AI connector (Stage 2 onboarding):** an MCP server that lets a member's AI assistant submit their profile directly.
10. **Other campuses:** the sign-in already accepts Goa, Hyderabad and Dubai emails; add campus fields and filters.
11. **Accessibility audit:** keyboard and screen-reader pass on modals and the dashboard.

## 12. Known limitations and gotchas

- **Demo mode stores data per browser,** and the first account created in a browser becomes admin. This is intended for previews only and is disabled in live mode.
- **Google sign-in uses a pop-up.** Some in-app browsers (Instagram, WhatsApp) block it; users should open the site in Chrome or Safari. The error message tells them.
- **`?emulator=1` test hook:** `js/db.js` has an emulator-only sign-in used by tests. It only activates on `localhost` with `?emulator=1`, never on a real domain.
- **Hash routing:** URLs look like `/#events`. That's fine for sharing, but weak for SEO (see backlog).
- **One venture per founder:** a member with two ideas can only list one. Changing that means changing the `ventures/{founderUid}` id scheme and its rules.
- **Founders see applicants' email addresses,** by design, so they can reach out. Mention this in a privacy note on the site.
- **Anyone can post to `messages`** (contact form). Limits are in the rules; add App Check for spam protection.
- **Sample data:** the hero preview's applicant names (Ananya, Rohan, Arjun, Meera) are illustrative, while the venture card comes from real data. The demo ventures and builders exist only in demo mode; "Load sample content" in live mode adds only events, opportunities, posts and resources.
- **Caching:** always run `npm run bump` before pushing CSS/JS changes.

## 13. Design system quick reference

- **Theme:** one continuous warm-dark canvas (`#0D0C0A`) with soft gold light, a faint dot grid, the banner's gold arc and slowly drifting gold "blobs".
- **Surfaces:** liquid glass, meaning translucent cards with an 18 px blur, a light top edge and a deep shadow. Tokens: `--glass`, `--glass-border`, `--glass-edge`, `--glass-blur`. The hero preview uses a darker "smoked" glass.
- **Colour:** brand gold `#F2B630`. Gold is also the only interaction colour (`--accent: #F5C04A`) for hover, focus and active states. Status colours: green for accepted/live, solid gold for new, soft gold for reviewing.
- **Type:** Instrument Serif (headlines), Inter (text), IBM Plex Mono (labels and numbers).
- **Motion:** sliding nav pill, page fades, sections easing in on scroll, count-up numbers, cards tilting toward the cursor (desktop only). All motion is disabled for users who set their device to reduce motion.
- **Corners:** 20 px on all cards.

## 14. Key decisions and why

| Decision | Why |
| --- | --- |
| No framework, no build step | A rotating student team can edit it with nothing but a text editor; it hosts free anywhere |
| Firebase over Supabase or Cloudflare | Google sign-in built in (BITS accounts are Google accounts); the Firebase console doubles as an admin view; free projects never pause (Supabase's free tier pauses after a week of inactivity); far less code to maintain than Cloudflare Workers plus D1 |
| GitHub Pages hosting | Free, deploys on push, supports custom domains with HTTPS |
| Google sign-in only, BITS emails only | No passwords to manage; keeps the community campus-first; enforced in the rules |
| Security in `firestore.rules` | Browser code can be tampered with; server rules can't |
| AI-assisted onboarding via copy-paste prompt | Works with any chatbot and needs no backend; a direct AI connector can come later |

## 15. People

| Role | Name | Contact |
| --- | --- | --- |
| Project lead | _fill in_ | |
| Owns Firebase project | _fill in_ | |
| Owns domain and DNS | _fill in_ | |
| Owns GitHub repo/org | _fill in_ | |
| Content (journal, resources) | Research & Knowledge team | |
| Events and opportunities | Events & Partnerships team | |
