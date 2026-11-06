# API reference

Endpoints of the Express API (`server/`), request bodies and status codes.

Base URL: `http://localhost:5000` in development (the Vite dev server proxies `/api`).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | `{ username, password }` (accounts that have set a password) |
| `POST` | `/api/auth/logout` | Ends the session |
| `GET` | `/api/auth/me` | The signed-in user (`username`, `hasPassword`, `providers`, `canSetPasswordWithoutCurrent`) or `null` |
| `PUT` | `/api/auth/password` | Signed in: `{ password, currentPassword? }`. `currentPassword` is needed unless you signed in with GitHub/Google in the last 10 minutes (`403` otherwise). Signs out other sessions. |
| `PUT` | `/api/auth/username` | Signed in: `{ username }`; `409` if taken |
| `GET` | `/api/auth/providers` | Enabled sign-in providers, e.g. `["github", "google"]` |
| `GET` | `/api/auth/oauth/:provider?from=/play` | Browser navigation: redirects to GitHub/Google. Add `link=1` while signed in to connect it to your account |
| `GET` | `/api/auth/oauth/:provider/callback` | Provider redirect target; signs in and redirects to `APP_URL` + `from`, or to `/login?oauth=<error>` |
| `POST` | `/api/auth/oauth/:provider/unlink` | Signed in: disconnect a provider (refused if it is your only way to sign in) |
| `GET` | `/api/puzzles/today/progress` | Signed-in player: your saved `grid`, `startedAt`, `solvedAt`, `timeMs` (starts the timer on first call) |
| `PUT` | `/api/puzzles/today/progress` | `{ date, grid }`: save letters (`409` until you have opened the puzzle with `GET`). `grid` is rows like the layout: `#` blocks, `A-Z` or space in open cells |
| `POST` | `/api/puzzles/today/check` | `{ date, grid }` → `entries`: `right` / `wrong` / `incomplete` per clue |
| `POST` | `/api/puzzles/today/guest-check` | Anyone: `{ date, grid }` → `{ entries, solved }`. Graded like `check`, but nothing is stored and nothing is ranked |
| `POST` | `/api/puzzles/today/submit` | `{ date, grid }` → `{ solved: true, timeMs, rank }` or `{ solved: false, wrong, incomplete }`; `409` if not opened yet or already solved; `400` if sooner than `MIN_SOLVE_SECONDS` after opening |
| `GET` | `/api/leaderboard?date=` | Top 50 solves for a day (default today): `rank`, `username`, `timeMs` |
| `GET` | `/api/me/stats` | Signed in: `solves`, `currentStreak`, `bestStreak`, `bestTimeMs`, last 30 solves |
| `GET` | `/api/puzzles/today` | Today's puzzle: `layout` (`#` block, `.` open cell), numbered `entries` with encrypted `clue`s, and `cipher` (`type`, plus `keyClue` and `keyLength` for Vigenère). No answers or keys. |
| `GET` | `/api/puzzles` | Past days that were played (up to 60), newest first |
| `GET` | `/api/puzzles/:date` | One day (`YYYY-MM-DD`). Past days include `solution`, each entry's `answer` and `plainClue`, and the cipher key. Unplayed or future days return 404. |

Example:

```bash
curl http://localhost:5000/api/puzzles/today
```

| Status | Meaning |
|--------|---------|
| `400` | Invalid body, JSON, date or token. `message` explains why. |
| `401` | Not logged in, or wrong username/password |
| `403` | Foreign `Origin`, or a password change without proof (current password or a recent GitHub/Google sign-in) |
| `409` | Username taken, or puzzle already solved |
| `415` | Write request without a JSON body |
| `404` | Puzzle or route not found |
| `413` | Body larger than 10 KB |
| `429` | Rate limit exceeded |
| `500` | Server error (details only in server logs) |

[Back to README](../README.md)
