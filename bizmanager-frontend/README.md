# BizManager Frontend

React + Vite admin console for the BizManager backend. Responsive from phone width up — same routes and components on mobile and desktop, just a different nav chrome (slide-in drawer vs. fixed sidebar).

## Quick start

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`. It already points at `http://localhost:8080` (see `.env`) — make sure the backend is running there first (`mvn spring-boot:run`, or with `-Dspring-boot.run.profiles=dev` for the zero-setup H2 mode).

If your backend runs somewhere else, edit `.env`:
```
VITE_API_BASE_URL=http://localhost:8080
```

```bash
npm run build      # production build → dist/
npm run preview    # serve that build locally
```

I built and ran both `npm run build` and `npm run dev` against this exact code before handing it over — it compiles clean and the dev server serves correctly. The one thing I obviously couldn't test from here is the actual live round-trip against your running backend, since this sandbox can't reach your machine — that's the first thing to verify on your end.

## How it's organized

```
src/
  api/            One file per backend module - thin axios wrappers, nothing else
  context/        AuthContext - the logged-in user + permission checks, read from localStorage
  components/ui/  Shared primitives (Button, Card, Table, Modal, Tabs, ...)
  components/layout/  AppLayout (responsive shell), route guards
  pages/          One file per screen, grouped by module
  utils/          Permission constants (mirrors the backend enum), date-range presets, formatters
```

## Auth & permissions

Login/register responses carry the user's permission list straight from the JWT claims (see the backend's `AuthResponse`). Nothing is re-derived or guessed on the frontend — `AuthContext.hasPermission()` / `hasAnyPermission()` just check that array. The sidebar, action buttons, and route access all gate off the same checks, so:
- A custom role with a partial permission set will see exactly the nav items and buttons it's entitled to, automatically — nothing hardcoded to role *names* except "Staff/StockManager don't see Dashboard" and "non-admin-tier users see My Profile."
- Direct URL navigation to a page you don't have permission for redirects you home (`RequirePermission`), not just hidden nav.

## Responsive approach

Rather than building separate mobile/desktop layouts, every page uses the same components with Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`). The two deliberate adaptations:
- **Nav**: fixed sidebar on `md:` and up, slide-in drawer behind a hamburger below that.
- **Tables**: horizontally scrollable on narrow screens rather than collapsing into cards — keeps dense data (sales history, audit log) fully visible and sortable-by-eye rather than fragmenting it.

## Design notes

Dark "ledger" palette (warm paper text on ink-slate) rather than a generic dashboard look, since the whole app is built around closing out a day's numbers. Two functional accents — amber for money/tickets, teal for "good" (present, in-stock) — plus rust for alerts, instead of one single bright color. The one deliberate flourish is the Dashboard's stat cards: a dashed "tear line" with punched notches, like a torn ticket stub — used only there, not spammed across every card in the app.

## What's NOT built yet (by design, to keep this a focused v1)

- No offline support / service worker
- No CSV export on tables — ask if you want this, it's a small addition per page
- No bulk actions (e.g. mark a whole week's attendance at once)
- Analytics charting is currently just the one revenue trend line — `recharts` is already a dependency if you want more
- No dark/light theme toggle (it's just dark — fits the subject, and halves the design surface to get right)

## A note on bundle size

`recharts` is the heaviest dependency, used only on the Analytics page. It's lazy-loaded (`React.lazy`) along with every other route except Login/Register/Dashboard, so it doesn't bloat the initial load — confirmed via `npm run build`: the main bundle is ~100KB gzipped, with Analytics split into its own ~104KB chunk that only downloads when someone actually visits it. Matters most on mobile connections.
