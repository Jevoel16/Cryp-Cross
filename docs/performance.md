# Performance

Budgets: Lighthouse 90 or higher in every category on mobile, LCP under 2.5s, INP under 200ms, CLS under 0.1, and at most 170 KB of gzipped JavaScript on first load.

## Lighthouse (mobile)

Measured on 2026-11-17 with Lighthouse 12.8.2 (simulated slow 4G, 4x CPU slowdown) against the production build served locally by `vite preview` with the in-memory API. `vite preview` doesn't compress responses, so the deployed site should load a little faster.

| Page | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |
|------|-------------|---------------|----------------|-----|-----|-----|-----|-----|
| Home (`/`) | 97 | 100 | 96 | 100 | 1.7s | 2.3s | 120ms | 0 |
| Play (`/play`) | 97 | 100 | 96 | 100 | 1.6s | 2.6s | 10ms | 0.022 |
| Leaderboard (`/leaderboard`) | 97 | 100 | 96 | 100 | 1.7s | 2.4s | 20ms | 0.004 |
| Past puzzles (`/puzzles`) | 98 | 100 | 96 | 100 | 1.7s | 2.3s | 0ms | 0.004 |
| How it works (`/idea`) | 98 | 100 | 96 | 100 | 1.7s | 2.2s | 10ms | 0.004 |
| Team (`/team`) | 98 | 100 | 96 | 100 | 1.7s | 2.2s | 10ms | 0.004 |
| Accessibility (`/accessibility`) | 98 | 100 | 96 | 100 | 1.7s | 2.2s | 10ms | 0.004 |
| Log in (`/login`) | 97 | 100 | 96 | 66 | 1.7s | 2.5s | 0ms | 0.004 |
| 404 | 98 | 100 | 96 | 66 | 1.7s | 2.3s | 0ms | 0.004 |

axe-core 4.14 found no violations on any of these pages in either theme.

- Play's LCP sits at 2.4 to 2.6s between runs, right on the 2.5s budget. The LCP element is the guest hint above the grid, which renders only after `/api/puzzles/today` answers.
- Best Practices loses points to one console error: `/_vercel/insights/script.js` is 404 locally because Vercel Web Analytics only exists on Vercel.
- TBT (0ms) stands in for INP, which needs real interactions to measure.
- The Log in and 404 pages are `noindex` on purpose, so their SEO score is not a target.

Run it again:

```bash
npm run build && npm run preview
```

```bash
npx lighthouse http://localhost:3000/ --view
```

## Bundle

| File | Raw | Gzipped |
|------|-----|---------|
| Initial JavaScript (`index-*.js`) | 270 KB | 87.0 KB |
| Stylesheet (`index-*.css`) | 28.5 KB | 6.0 KB |
| Route chunks, loaded on demand (Accessibility, Account, Archive, How it works, Leaderboard, Log in, Team) | 1–8 KB each | 0.6–2.6 KB each |

Home and Play are in the initial bundle; every other route is lazy-loaded.

## Fonts

Two families, self-hosted, latin subset only, `font-display: swap`. The two Space Grotesk files that draw the first screen (400 and 700) are preloaded.

| File | Size |
|------|------|
| Space Grotesk 400 / 500 / 700 | 13.4 / 13.3 / 12.8 KB |
| JetBrains Mono 400 / 700 | 21.2 / 21.9 KB |

## What was changed, with numbers

| Change | Before | After |
|--------|--------|-------|
| Latin-only font subsets | 42 font files in the build | 10 |
| Lazy-loaded routes | 90.5 KB gzipped initial JS | 85.4 KB |
| Preload the heading and body fonts | LCP 2.6s, Performance 95 | LCP 2.4s, Performance 97 |
| README logo moved out of the site | 308 KB shipped in `build/` | 0 (95 KB copy in `docs/images/`) |
| Footer renders with the page, not before it | CLS 0.103 on How it works, 0.099 on Accessibility | 0.004 |
| Shared requests | `/api/puzzles/today` fetched by Home and again by Play; `/api/auth/providers` fetched twice on Log in | Once each |

## Server and database

- Vercel compresses responses and serves hashed assets with `Cache-Control: public, max-age=31536000, immutable`. API responses are `no-store`.
- Lists are capped: 60 archive days, 50 leaderboard rows, 30 history rows.
- Indexes: `attempts { user, date }` (unique) for every per-player query, `attempts { date, timeMs, solvedAt }` for the leaderboard sort, `dailypuzzles { date }` (unique), `users { username }` (unique).
- Queries select only the fields they return and use `.lean()` for read-only lists. Every query has a 5 second limit.
- Autosave is debounced by one second; requests for a date the player has left are cancelled.

[Back to README](../README.md)
