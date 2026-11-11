# Decisions

The non-obvious choices in Cryp-Cross: the problem, what was considered, what was chosen and what it costs. The mechanics behind several of them are in [architecture.md](architecture.md).

## Accounts come only from GitHub or Google, and no email is stored

- **Problem:** players need accounts for a ranked leaderboard, but email sign-up means verifying addresses, sending mail and storing personal data.
- **Options:** email and password with verification; magic links; OAuth only.
- **Choice:** OAuth only (GitHub and Google), matched by the provider's user ID. An optional password can be added later for username login.
- **Trade-off:** someone without a GitHub or Google account can only play as a guest. In return there is no mailer, no reset-token flow and no email address to leak.

## The server times the solve, not the browser

- **Problem:** a leaderboard is worthless if the client reports its own time.
- **Options:** trust a client timer; start a server timer on first save; start it when the puzzle is opened.
- **Choice:** the timer starts only on `GET /api/puzzles/today/progress`, solves under `MIN_SOLVE_SECONDS` are refused, and the puzzle seed is an HMAC of the date so tomorrow's answers can't be computed from the public source.
- **Trade-off:** a player can still read the clues signed out, then sign in and submit after the minimum time. That is accepted so guests can keep playing without an account.

## Guests can play, but nothing they do is stored

- **Problem:** asking for an account before the first puzzle loses most visitors.
- **Options:** require sign-in; anonymous server-side attempts; grade guests without storing anything.
- **Choice:** `POST /api/puzzles/today/guest-check` grades a grid and stores nothing. The guest's letters and timer live in the browser.
- **Trade-off:** guest progress doesn't follow the player to another device and never ranks.

## A shared demo account instead of a "skip sign-in" switch

- **Problem:** a reviewer should see saved progress, the server timer and the Account page within seconds, without creating an account.
- **Options:** a fake signed-in mode in the frontend; a seeded read-only account; a seeded account that can play.
- **Choice:** a seeded `demo` user that signs in through the normal login route. It can play, but it can't change its username, password or providers, its solves are left out of every ranking, and each demo login clears its attempt for the day.
- **Trade-off:** two reviewers at the same moment share one grid. The credentials are public by design, so the account is limited instead of secret.

## One explicit state machine per flow

- **Problem:** state was spread over flags (`busy` + `message`, `solvedAt` checks in several routes), which allowed real bugs: two submits at once could overwrite a solve, and a failed progress request silently turned a signed-in player into a guest.
- **Options:** patch each bug; adopt a state-machine library; plain reducers and transition tables.
- **Choice:** plain reducers and frozen constant tables, one per flow, listed in [state-machines.md](state-machines.md). On the server, writes to an attempt are conditional updates, so the database enforces the transition.
- **Trade-off:** more small files and tests. No new dependency, and each machine can be read in one place.

## The attempt status is derived, not stored

- **Problem:** making the attempt lifecycle explicit usually means adding a `status` column and migrating old rows.
- **Options:** add and backfill a `status` field; derive the status from `solvedAt`.
- **Choice:** `attemptStatus()` derives it. Every write filters on `solvedAt` not existing, which is the same rule expressed to MongoDB.
- **Trade-off:** the status isn't visible as a field in the database. No migration was needed and old data stayed valid.

## Rate-limit counters and sessions live in MongoDB

- **Problem:** on Vercel each serverless instance has its own memory, so in-memory limits and sessions don't hold.
- **Options:** Redis; a hosted rate-limit service; the MongoDB that is already there.
- **Choice:** MongoDB for both (`connect-mongo` for sessions, a small store for `express-rate-limit`).
- **Trade-off:** a database write per counted request. One less service to run and pay for.

## The site and the API share one origin

- **Problem:** a session cookie across two domains needs `SameSite=None` and a wide CORS policy.
- **Options:** API on a separate host; one Vercel project that rewrites `/api/*` to a serverless function.
- **Choice:** one origin. The cookie stays `SameSite=Lax` and the CSP can use `connect-src 'self'`.
- **Trade-off:** the API can't scale or deploy separately from the site.

## JavaScript, not TypeScript

- **Problem:** types would catch a class of mistakes, but the project was already written in JavaScript.
- **Options:** migrate; stay and lean on tests.
- **Choice:** stay on JavaScript. Frozen constant objects stand in for unions, and each state machine has transition tests.
- **Trade-off:** no compile-time check on payload shapes. A migration would have been churn without a user-visible gain.

## No UI framework or CSS library

- **Problem:** the UI needs to be consistent and small.
- **Options:** Tailwind; a component library; plain CSS with tokens.
- **Choice:** plain CSS with spacing, type, radius and colour tokens in `src/App.css`, one small SVG icon set and self-hosted latin fonts.
- **Trade-off:** more CSS written by hand. The whole stylesheet is about 6 KB gzipped and the CSP needs no third-party origins.

[Back to README](../README.md)
