# Security

How Cryp-Cross meets each item of its security checklist, and which items don't apply. To report a problem, open an issue at [github.com/Jevoel16/Cryp-Cross](https://github.com/Jevoel16/Cryp-Cross/issues) without exploit details and ask for a private contact.

## What is stored

| Data | Where | Kept for |
|------|-------|----------|
| Username, GitHub and Google user IDs, optional bcrypt password hash | `users` | Until the account is removed |
| Saved grids, start and solve times, check counts | `attempts` | Indefinitely (they feed stats and past leaderboards) |
| Session ID, user ID, sign-in time and method | `sessions` | 14 days after the last request |
| Request counters keyed by IP address | rate-limit collections | 15 minutes |

No email address, real name, profile picture or access token is stored. GitHub is asked for no scope and Google for `openid profile` only; the access token is used once to read the profile and then dropped.

## Checklist

| # | Item | Status | How |
|---|------|--------|-----|
| 1 | Admin routes | Not applicable | There is no admin role or admin route. |
| 2 | Access control on the server | Done | `requireAuth` (`server/middleware/auth.js`) guards every ranked and account route. The UI is never the only check. |
| 3 | Per-user data scoping | Done | Every attempt query filters by the session's user ID. No route takes a user ID from the client. |
| 4 | Verify email on sign-up | Not applicable | No email is collected; identity comes from GitHub or Google. |
| 5 | Hashed passwords | Done | bcrypt, cost 12 (`server/services/accounts.js`). |
| 6 | No tokens in `localStorage` | Done | The session is an `httpOnly`, `SameSite=Lax` cookie, `Secure` in production. `localStorage` holds only the theme, the grid draft and the guest timer. |
| 7 | Secrets only on the server | Done | The frontend bundle gets only `VITE_API_URL` and `VITE_SITE_URL`. |
| 8 | `.env` out of git | Done | `.env` is gitignored; `.env.example` files hold placeholders only. |
| 9 | No secrets or personal data in logs | Done | Errors log the method, path and message only; OAuth tokens and profiles are never logged. |
| 10 | Parameterized queries | Done | Mongoose only, with validated input; no string-built queries. |
| 11 | Server-side input validation | Done | `server/lib/validate.js` for accounts, `validateGrid` for every grid, day keys checked by format. |
| 12 | XSS | Done | React escapes output, there is no `innerHTML`, and the CSP allows scripts from `'self'` only. |
| 13 | Uploads | Not applicable | There are no uploads. |
| 14 | Webhooks | Not applicable | There are no webhooks. |
| 15 | Rate limiting | Done | 300 requests and 60 writes per 15 minutes per IP, 10 for login and password changes, 30 for OAuth. Counters are shared through MongoDB. |
| 16 | CORS | Done | An explicit allow-list from `CORS_ORIGINS` with credentials; never `*`. |
| 17 | No debug output in production | Done | The central error handler answers `Internal Server Error` and logs the detail server-side. |
| 18 | Patched dependencies | Done | `npm audit --audit-level=high` runs in CI for the frontend and the backend. |
| 19 | Security scan before release | Due before the next release | `/security-review` is run before each release and its findings fixed first. Last run: v2.0.0; the changes since then are due a run before the next release. |
| 20 | CSRF | Done | Writes need an allowed `Origin` and a JSON body, on top of the `SameSite=Lax` cookie (`csrfGuard` in `server/app.js`). OAuth uses `state` and PKCE. |
| 21 | Security headers | Done | Site: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'` in `vercel.json` and `serve.json`. API: the same through helmet, plus `Cache-Control: no-store`. |
| 22 | Sessions | Done | New session ID on every login; 14-day idle expiry; logout destroys the session; a password change ends every other session. There are no reset tokens. |
| 23 | No account enumeration | Done | Login gives one message and compares against a dummy hash when the user is unknown. Usernames are public on the leaderboard, so "username taken" reveals nothing new. |
| 24 | Access-control tests | Done | `server/test/play.test.js` proves every ranked route answers 401 signed out and that one player's saves, checks and solves never change another's attempt or stats. |
| 25 | Limits | Done | 10 KB body limit; lists capped at 60 (archive), 50 (leaderboard) and 30 (history); 5 second query limit and a socket timeout. |
| 26 | Redirects and server-side fetches | Done | `from` must be a same-site path (`safeRedirectPath`); redirect hosts come from environment variables; OAuth endpoints are fixed constants. |
| 27 | Secret scanning | Done | gitleaks scans the full history in CI. The demo account's public credentials are allow-listed in `.gitleaks.toml`. |
| 28 | Least privilege and minimal data | Partly yours | The app needs `readWrite` on its one database and nothing else; create the Atlas user with only that role. Data collected is listed above. |
| 29 | This document | Done | Linked from the README. |

## The demo account

Its credentials are public on purpose (they are shown on the Log in page). It is limited instead of secret: it can't change its username, password or connected accounts, its solves are never ranked, and it holds no data worth taking. Set `DEMO_ACCOUNT=off` to remove it from the Log in page and stop seeding it.

## Known limits

- A player can read the public clues signed out, then sign in and submit after `MIN_SOLVE_SECONDS`. Accepted so guests can play.
- Attempts are kept indefinitely; there is no self-service account deletion yet.
- The 4 moderate `npm audit` findings are in ESLint's development tooling and don't ship.

[Back to README](../README.md)
