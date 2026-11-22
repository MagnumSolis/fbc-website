# FBC Website: Prototype v0.1

Clickable prototype for the Founders and Builders Collective (BITS Pilani) website.
Plain HTML/CSS/JS with no build step. All data is **sample data** and login is mocked with `localStorage`.

## Run it
    cd fbc-website
    python3 -m http.server 8000
    # open http://localhost:8000

## Pages (hash routes)
| Route | What it is |
|---|---|
| `#/` | Landing: hero, the co-founder problem (Way 1 vs Way 2), 4 pillars, matchmaking, VistaDex, events, journal |
| `#/signup` `#/login` | BITS-email-only auth, role picker (Founder / Builder / Explorer) |
| `#/onboarding` | 3-step profile setup, with different questions for founders vs builders |
| `#/dashboard` | Profile completion, match suggestions, applications, RSVPs, profile |
| `#/matchmaking` | Ventures and builders directory with search and filters, apply modal |
| `#/validate` | VistaDex feature + free 7-question idea check (no login needed) |
| `#/opportunities` | Internships / campus startup roles / projects |
| `#/events` | Upcoming and past events, RSVP |
| `#/journal` `#/journal/:id` | Startup stories, analysis, failure files, newsletter |
| `#/resources` | Guides, templates, books, tools |
| `#/roadmap` | Founder journey + FBC phase timeline |
| `#/contact` | Contact form, core team, FAQ |

## Design system
- **Black** `#0A0B0D` + **Gold** `#F5B829` (taken from the logo dot and banner)
- **Third accent** is used *only* for interaction: hover, focus rings, button press ripple, active states.
  The floating "Accent" switcher (bottom-right) lets the team try Teal / Ember / Violet / Ice live. Delete it once you've picked one.
- Fonts: Outfit (display), Inter (body), Caveat (the "From Ideas to Impact" script)

## Files
- `js/data.js`: all sample content (ventures, events, posts, roadmap…). Edit this to change content.
- `js/app.js`: router, views and interactions
- `css/styles.css`: tokens at the top (`:root`)

## TODO before real launch
- [ ] Real VistaDex URL + description (`links.vistadex` in `data.js`, copy in the `validate` view)
- [ ] Real backend/auth (e.g. Supabase/Firebase with Google sign-in restricted to BITS domain)
- [ ] Real events, posts, opportunities
- [ ] Confirm event venues
