# FBC website: Next.js version (migration in progress)

The FBC website rebuilt on **Next.js 16 + React 19 + TypeScript**, keeping the same design, Firebase backend and security rules (`../firestore.rules`). It builds to a static site (`out/`) that can be hosted anywhere.

## Run
```bash
cd next-app
npm install
npm run dev          # http://localhost:3000 (demo mode unless Firebase keys are set)
npm run build        # static export to out/
npm run lint
```
Copy `.env.example` to `.env.local` and fill in the Firebase keys to run against a real project. With no keys, the site runs in demo mode (data saved in the browser).

## Structure
| Path | What it is |
| --- | --- |
| `src/app/` | Routes. Each `page.tsx` is thin: metadata plus a view. `layout.tsx` holds fonts, nav, footer, background |
| `src/views/` | One component per page (Home, Matchmaking, Validate, Events, Journal…) |
| `src/components/` | Shared UI: `providers.tsx` (auth/profile/settings, toast, modal), `Nav`, `Footer`, `Effects` (tilt, reveal, count-up), `blocks.tsx`, `ui.tsx` |
| `src/lib/db/` | **Data layer.** `index.ts` is the only API pages use; `adapter.ts` is the contract; `demo.ts` and `firebase.ts` implement it. A future `supabase.ts` adapter plugs in via `lib/config.ts` without touching pages |
| `src/lib/` | `content.ts` (option lists, seed data), `types.ts`, `format.ts`, `ai.ts` (AI onboarding), `ideacheck.ts`, `markdown.ts`, `config.ts` |
| `src/app/globals.css` | The design system (same tokens as the current site) |

## Migration status
| Area | Status |
| --- | --- |
| Design system, layout, nav (sliding pill), footer, motion | Done |
| Data layer (demo + Firebase adapters, typed) | Done |
| Home, Matchmaking, Validate, Opportunities, Events, Journal (+ post), Resources, About, Contact, Join, Sign in | Done |
| Profile setup (manual + AI), Dashboard, Admin console | Next stage (placeholders link to the current site) |
| Deployment (GitHub Actions to Pages or Vercel) and switch-over | After parity |

## Deploying (once at parity)
- **GitHub Pages:** set `NEXT_PUBLIC_BASE_PATH=/fbc-website`, run `npm run build`, publish `out/` (a GitHub Actions workflow will do this).
- **Custom domain, Vercel or Cloudflare Pages:** leave `NEXT_PUBLIC_BASE_PATH` empty and set `NEXT_PUBLIC_SITE_URL` to the domain.
