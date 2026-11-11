# API reference

The Express API in `server/`. Base URL: `http://localhost:5000` in development (the Vite dev server proxies `/api`), the site's own origin in production.

## Conventions

- Every answer is JSON: `{ "success": true, "data": ... }`, or `{ "success": false, "message": "..." }` with an HTTP error status. Validation errors also list each problem in `errors`.
- The session is an `httpOnly` cookie (`cc.sid`). Send it back on later requests (`curl -c jar -b jar`).
- Writes (`POST`, `PUT`) need `Content-Type: application/json` and, from a browser, an allowed `Origin`.
- `grid` is an array of rows shaped like the puzzle layout: `#` for a block, `A-Z` or a space for an open cell.
- Responses are never cached (`Cache-Control: no-store`).

| Status | Meaning |
|--------|---------|
| `400` | Invalid body, JSON or date. `message` says why. |
| `401` | Not logged in, or wrong username or password |
| `403` | Foreign `Origin`, a password change without proof, or a change to the demo account |
| `404` | Puzzle or route not found |
| `409` | Username taken, puzzle not opened yet, or puzzle already solved |
| `413` | Body larger than 10 KB |
| `415` | Write request without a JSON body |
| `429` | Rate limit exceeded |
| `500` | Server error (details only in server logs) |
| `503` | Database not connected (health check) |

## Health

### `GET /api/health`

```bash
curl http://localhost:5000/api/health
```

```json
{ "success": true, "data": { "status": "ok", "db": true } }
```

Answers `503` with `"status": "degraded"` when the database is not connected. No session, no rate limit.

## Puzzles

### `GET /api/puzzles/today`

Today's puzzle without answers or keys. `layout` uses `#` for a block and `.` for an open cell. A Vigenère cipher also has `keyClue` and `keyLength`.

```bash
curl http://localhost:5000/api/puzzles/today
```

```json
{
  "success": true,
  "data": {
    "date": "2026-11-11",
    "cipher": { "type": "caesar" },
    "width": 12,
    "height": 11,
    "layout": ["....#.......", "#.##...#...."],
    "entries": [{ "number": 1, "direction": "across", "row": 0, "col": 0, "length": 4, "clue": "Vhfuhw phvvdjh" }],
    "isToday": true
  }
}
```

### `GET /api/puzzles`

Past days that were played (up to 60), newest first.

```bash
curl http://localhost:5000/api/puzzles
```

```json
{ "success": true, "data": [{ "date": "2026-11-10", "cipher": "atbash" }, { "date": "2026-11-09", "cipher": "vigenere" }] }
```

### `GET /api/puzzles/:date`

One day (`YYYY-MM-DD`). Past days include the `solution`, each entry's `answer` and `plainClue`, and the cipher key. Unplayed or future days answer `404`.

```bash
curl http://localhost:5000/api/puzzles/2026-11-10
```

```json
{
  "success": true,
  "data": {
    "date": "2026-11-10",
    "cipher": { "type": "caesar", "shift": 3 },
    "width": 12,
    "height": 11,
    "layout": ["....#.......", "#.##...#...."],
    "entries": [
      {
        "number": 1,
        "direction": "across",
        "row": 0,
        "col": 0,
        "length": 4,
        "clue": "Vhfuhw phvvdjh",
        "answer": "CODE",
        "plainClue": "Secret message"
      }
    ],
    "solution": ["CODE#PUZZLES", "#A##KEY#GRID"],
    "isToday": false
  }
}
```

## Playing

The ranked routes need a session. `GET progress` must come first: it creates the attempt and starts the timer.

### `GET /api/puzzles/today/progress`

```bash
curl -b jar http://localhost:5000/api/puzzles/today/progress
```

```json
{
  "success": true,
  "data": { "date": "2026-11-11", "grid": [], "startedAt": "2026-11-11T08:00:00.000Z", "solvedAt": null, "timeMs": null }
}
```

### `PUT /api/puzzles/today/progress`

Saves letters. `409` until the puzzle was opened with `GET`. A solved grid is returned unchanged.

```bash
curl -b jar -X PUT http://localhost:5000/api/puzzles/today/progress \
  -H "Content-Type: application/json" \
  -d '{ "date": "2026-11-11", "grid": ["CO  #       ", "# ##   #    "] }'
```

```json
{
  "success": true,
  "data": {
    "date": "2026-11-11",
    "grid": ["CO  #       ", "# ##   #    "],
    "startedAt": "2026-11-11T08:00:00.000Z",
    "solvedAt": null,
    "timeMs": null
  }
}
```

### `POST /api/puzzles/today/check`

Says which clues are right, wrong or incomplete, in the order of `entries`, without revealing answers. Also saves the grid.

```bash
curl -b jar -X POST http://localhost:5000/api/puzzles/today/check \
  -H "Content-Type: application/json" \
  -d '{ "date": "2026-11-11", "grid": ["CODE#       ", "# ##   #    "] }'
```

```json
{ "success": true, "data": { "entries": ["right", "incomplete", "incomplete"] } }
```

### `POST /api/puzzles/today/guest-check`

The same grading for anyone, signed in or not. Nothing is stored and nothing is ranked.

```bash
curl -X POST http://localhost:5000/api/puzzles/today/guest-check \
  -H "Content-Type: application/json" \
  -d '{ "date": "2026-11-11", "grid": ["CODE#PUZZLES", "#A##KEY#GRID"] }'
```

```json
{ "success": true, "data": { "entries": ["right", "right", "right"], "solved": true } }
```

### `POST /api/puzzles/today/submit`

Records one timed solve per day. `409` if the puzzle was not opened or is already solved; `400` if sooner than `MIN_SOLVE_SECONDS` after opening. `rank` is `null` for the demo account.

```bash
curl -b jar -X POST http://localhost:5000/api/puzzles/today/submit \
  -H "Content-Type: application/json" \
  -d '{ "date": "2026-11-11", "grid": ["CODE#PUZZLES", "#A##KEY#GRID"] }'
```

```json
{ "success": true, "data": { "solved": true, "timeMs": 252000, "rank": 3 } }
```

When the grid is not correct yet:

```json
{ "success": true, "data": { "solved": false, "wrong": 1, "incomplete": 2 } }
```

### `GET /api/leaderboard?date=YYYY-MM-DD`

Top 50 solves for a day (default today). Only usernames and times are public.

```bash
curl "http://localhost:5000/api/leaderboard?date=2026-11-10"
```

```json
{
  "success": true,
  "data": { "date": "2026-11-10", "solvers": 2, "entries": [{ "rank": 1, "username": "alice", "timeMs": 187000 }] }
}
```

### `GET /api/me/stats`

```bash
curl -b jar http://localhost:5000/api/me/stats
```

```json
{
  "success": true,
  "data": {
    "solves": 12,
    "currentStreak": 3,
    "bestStreak": 7,
    "bestTimeMs": 187000,
    "history": [{ "date": "2026-11-10", "timeMs": 252000 }]
  }
}
```

`history` holds the last 30 solves.

## Accounts

### `GET /api/auth/providers`

```bash
curl http://localhost:5000/api/auth/providers
```

```json
{ "success": true, "data": ["github", "google"] }
```

### `GET /api/auth/demo`

Credentials of the shared demo account, or `null` when `DEMO_ACCOUNT` is off. They are public on purpose.

```bash
curl http://localhost:5000/api/auth/demo
```

```json
{ "success": true, "data": { "username": "demo", "password": "decode-the-grid" } }
```

### `POST /api/auth/login`

For accounts that have set a password (and the demo account).

```bash
curl -c jar -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "username": "demo", "password": "decode-the-grid" }'
```

```json
{ "success": true, "data": { "username": "demo", "hasPassword": true, "providers": [], "demo": true } }
```

A wrong username and a wrong password get the same answer:

```json
{ "success": false, "message": "Wrong username or password" }
```

### `GET /api/auth/me`

The signed-in user, or `null`. `demo` is present only for the demo account.

```bash
curl -b jar http://localhost:5000/api/auth/me
```

```json
{
  "success": true,
  "data": { "username": "alice", "hasPassword": false, "providers": ["github"], "canSetPasswordWithoutCurrent": true }
}
```

### `POST /api/auth/logout`

```bash
curl -b jar -X POST http://localhost:5000/api/auth/logout -H "Content-Type: application/json" -d '{}'
```

```json
{ "success": true }
```

### `PUT /api/auth/username`

`409` if the name is taken.

```bash
curl -b jar -X PUT http://localhost:5000/api/auth/username \
  -H "Content-Type: application/json" \
  -d '{ "username": "alice_k" }'
```

```json
{ "success": true, "data": { "username": "alice_k", "hasPassword": false, "providers": ["github"] } }
```

### `PUT /api/auth/password`

`currentPassword` is needed unless you signed in with GitHub or Google in the last 10 minutes (`403` otherwise). Saving signs out your other sessions.

```bash
curl -b jar -X PUT http://localhost:5000/api/auth/password \
  -H "Content-Type: application/json" \
  -d '{ "password": "a long new password", "currentPassword": "the old password" }'
```

```json
{
  "success": true,
  "message": "Password saved",
  "data": { "username": "alice", "hasPassword": true, "providers": ["github"] }
}
```

### `GET /api/auth/oauth/:provider?from=/play`

A browser navigation, not a fetch: redirects to GitHub or Google. Add `link=1` while signed in to connect the provider to your account.

```bash
curl -i "http://localhost:5000/api/auth/oauth/github?from=/play"
```

```
HTTP/1.1 302 Found
Location: https://github.com/login/oauth/authorize?client_id=...&state=...&code_challenge=...
```

### `GET /api/auth/oauth/:provider/callback`

Where the provider sends the browser back. Signs in and redirects to `APP_URL` + `from`, or to `/login?oauth=<code>` with one of `denied`, `state`, `failed`, `linked`, `demo` or `busy`.

```
HTTP/1.1 302 Found
Location: https://cryp-cross.example.dev/play
```

### `POST /api/auth/oauth/:provider/unlink`

Disconnects a provider. Refused with `400` if it is the account's only way to sign in.

```bash
curl -b jar -X POST http://localhost:5000/api/auth/oauth/github/unlink -H "Content-Type: application/json" -d '{}'
```

```json
{ "success": true, "data": { "username": "alice", "hasPassword": true, "providers": ["google"] } }
```

[Back to README](../README.md)
