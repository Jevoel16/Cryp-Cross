<a id="readme-top"></a>

<div align="center">
  <img src="public/logomain.png" alt="Cryp-Cross logo" width="120" />

  <h1>Cryp-Cross</h1>

  <p><strong>A daily cryptographic crossword: decode the encrypted clues, fill the grid, keep your streak.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/react-19.2.0-blue?style=flat" alt="React 19.2.0" />
    <img src="https://img.shields.io/badge/react--router--dom-7.18.5-blue?style=flat" alt="React Router 7.18.5" />
    <img src="https://img.shields.io/badge/vite-8.3.5-blue?style=flat" alt="Vite 8.3.5" />
    <img src="https://img.shields.io/badge/vitest-5.1.0-blue?style=flat" alt="Vitest 5.1.0" />
    <img src="https://img.shields.io/badge/eslint-10.14.0-blue?style=flat" alt="ESLint 10.14.0" />
    <img src="https://img.shields.io/badge/express-4.22.3-blue?style=flat" alt="Express 4.22.3" />
    <img src="https://img.shields.io/badge/mongoose-7.8.13-blue?style=flat" alt="Mongoose 7.8.13" />
    <img src="https://img.shields.io/badge/helmet-8.3.0-blue?style=flat" alt="helmet 8.3.0" />
    <img src="https://img.shields.io/badge/express--rate--limit-7.5.1-blue?style=flat" alt="express-rate-limit 7.5.1" />
    <img src="https://img.shields.io/badge/express--session-1.19.0-blue?style=flat" alt="express-session 1.19.0" />
    <img src="https://img.shields.io/badge/connect--mongo-6.0.0-blue?style=flat" alt="connect-mongo 6.0.0" />
    <img src="https://img.shields.io/badge/bcryptjs-3.0.3-blue?style=flat" alt="bcryptjs 3.0.3" />
    <img src="https://img.shields.io/badge/nodemailer-10.3.1-blue?style=flat" alt="nodemailer 10.3.1" />
    <img src="https://img.shields.io/badge/mongodb--memory--server-10.4.3-blue?style=flat" alt="mongodb-memory-server 10.4.3" />
    <img src="https://img.shields.io/badge/node-22-blue?style=flat" alt="Node 22" />
  </p>
  <p>
    <img src="https://img.shields.io/badge/version-0.8.2-green?style=flat" alt="Version 0.8.2" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-Sprucetrap%20Source--Available-orange?style=flat" alt="License: Sprucetrap Source-Available" /></a>
    <img src="https://img.shields.io/badge/platform-web-lightgrey?style=flat" alt="Platform: web" />
    <a href="https://github.com/Jevoel16/Cryp-Cross/actions/workflows/ci.yml"><img src="https://github.com/Jevoel16/Cryp-Cross/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  </p>
</div>

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration and Environment Variables](#configuration-and-environment-variables)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## About

Cryp-Cross is a free daily crossword where every clue is encrypted. Each day the server generates one grid for everyone and hides its clues behind a classical cipher (Caesar, Atbash or Vigenère). Players crack the cipher with a built-in decoder, fill the grid and, with a free account, check answers, submit timed solves and climb the leaderboard. It is a MERN app (MongoDB, Express, React, Node.js).

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Features

**Frontend (React)**
- **Play page** (`/play`): today's grid with keyboard and touch input (letters, Backspace, arrows, Space to switch direction, Tab/Enter for the next clue), across/down clue lists, and the current clue above the grid
- **Decoder workbench** for the day's cipher: a Caesar shift slider with an "all 25 shifts" view, Atbash, and Vigenère with a keyword box and the plain key clue
- Unsaved letters are kept per browser, so a refresh doesn't lose them
- **For verified players**: progress saved to the server as you type, a running timer, **Check** (marks each clue right, wrong or unfinished without revealing answers) and **Submit** (one timed solve per day, then the grid locks)
- **Leaderboard** (`/leaderboard`): today's fastest solves, or any past day with `?date=YYYY-MM-DD`
- **Archive** (`/puzzles`, `/puzzles/:date`): past days with the solution, decoded clues and the cipher key
- **Account stats**: puzzles solved, current and best streak, best time and recent solves
- Info pages: Home, How it works (`/idea`) and a Team carousel
- Accounts: sign up, log in, log out, verify email, forgot/reset password and an account page; a banner reminds unverified players to confirm their email
- Light/dark theme toggle, remembered in `localStorage`
- Client-side routing with React Router and a 404 page
- SEO: a unique title, description and canonical URL per page, `noindex` on the error page, JSON-LD, Open Graph tags, `llms.txt`, and a `sitemap.xml` + `robots.txt` generated at build time
- Optimized assets: WebP team photos at display size and correctly sized app icons
- Production security headers via `serve.json` (CSP, HSTS, `nosniff`, frame blocking) and long-term caching for hashed static files

**Backend (Express)**
- **Daily cipher crossword generator**: each day (in `PUZZLE_TZ`) a crossword of 8–12 words is built from `server/data/words.txt`, deterministically from the date, and stored in MongoDB so it never changes afterwards
- **Encrypted clues**: the day's cipher is Caesar (hidden shift), Atbash, or Vigenère (the key is the answer to an extra plain-text key clue)
- Puzzle API: today's puzzle without answers or keys, plus an archive of past played days with answers revealed
- **Attempts**: per-player progress, server-side answer checking, timed submissions (the timer starts only when a verified player opens the day with `GET /progress`; saving, checking and submitting require that, solves faster than `MIN_SOLVE_SECONDS` are refused, and the puzzle seed includes `PUZZLE_SECRET` so answers can't be computed in advance), a leaderboard that exposes only usernames and times, and streak stats
- **Accounts**: email + username + password (bcrypt, cost 12), email verification and password reset with single-use, expiring links (only SHA-256 hashes stored), and sessions in MongoDB behind an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production). A password reset signs out every other session.
- Brute-force and abuse protection: 10 login/signup/reset attempts per 15 minutes per IP, constant-time login answers, and no account enumeration on signup or forgot-password
- CSRF protection for cookie-authenticated writes: foreign `Origin` headers are refused and writes must be JSON
- 10 KB JSON body limit
- Security headers with `helmet`, a CORS allow-list (`CORS_ORIGINS`) and rate limiting (300 requests / 15 min per IP, 60 writes)
- Generic error responses: no internal messages or stack traces reach clients
- Environment-based configuration with `dotenv`

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Vite 8 (build and dev server), plain CSS |
| Frontend tooling | ESLint 10 (flat config, react-hooks plugin), Vitest 5 |
| Backend testing | node:test, mongodb-memory-server (in-memory MongoDB) |
| Backend | Node.js 22, Express 4, Mongoose 7, express-session + connect-mongo, bcryptjs, nodemailer, helmet, express-rate-limit, cors, dotenv |
| Database | MongoDB (MongoDB Atlas recommended) |
| Production frontend server | `serve` with `serve.json` (SPA rewrites) |
| CI | GitHub Actions |

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Prerequisites

- Node.js 22 (see `.nvmrc`) and npm
- A MongoDB database, for example a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- Git

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Installation

```bash
git clone https://github.com/Jevoel16/Cryp-Cross.git
```

```bash
cd Cryp-Cross
```

```bash
npm install
```

```bash
npm install --prefix server
```

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Configuration and Environment Variables

**Backend:** copy `server/.env.example` to `server/.env` and fill it in.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | MongoDB connection string |
| `PORT` | no | Port for the Express API (default `5000`, which the frontend expects in development) |
| `CORS_ORIGINS` | in production | Comma-separated frontend origins allowed to call the API and send cookie-authenticated writes; must include the site's own origin. Unset: `http://localhost:3000` in development, no browser origins in production. |
| `SESSION_SECRET` | in production | Long random string that signs the session cookie. Development uses a random one per start (sessions end when the API restarts). |
| `APP_URL` | in production | Public site URL used in email links (default `http://localhost:3000`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | in production | SMTP server for account emails (port 465 uses TLS). Empty `SMTP_HOST` in development prints emails to the API console. |
| `MAIL_FROM` | no | Sender address for account emails |
| `AUTH_RATE_LIMIT` | no | Login/signup/reset attempts per IP per 15 minutes (default `10`) |
| `PUZZLE_SECRET` | in production | Secret mixed into the puzzle seed (HMAC of the date), so future puzzles can't be generated from the public source. Changing it only affects puzzles not yet created. |
| `MIN_SOLVE_SECONDS` | no | Correct submissions sooner than this after opening the puzzle are refused (default `30`) |
| `PUZZLE_TZ` | no | IANA time zone that decides when the daily puzzle changes (default `UTC`) |
| `TRUST_PROXY` | no | Set to `1` behind one reverse proxy (Render, Railway) so rate limiting sees real client IPs. Default `0`. |
| `NODE_ENV` | no | Set to `production` in production |

**Frontend:** optional, set in a root `.env` file or in your hosting provider.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | no | Base URL of the API when it is on another origin. Empty (default) means same origin: in development Vite proxies `/api` to `http://localhost:5000`. |
| `VITE_SITE_URL` | in production | Public site URL (https, no trailing slash). Used for canonical links and to generate `sitemap.xml` / `robots.txt` after `npm run build`. `SITE_URL` also works for the sitemap step. Vite only exposes variables prefixed with `VITE_` to the browser bundle, so never put secrets in them. |

See `.env.example` for a template.

`.env` files are gitignored. Never commit real credentials.

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Usage

### Run locally

Start the API in one terminal:

```bash
npm start --prefix server
```

You should see `Server is running on http://localhost:5000` and `Database Connected`.

Start the frontend in a second terminal:

```bash
npm start
```

The Vite dev server runs at `http://localhost:3000` and proxies `/api` requests to `http://localhost:5000`.

### Try it without MongoDB

```bash
npm run dev:memory --prefix server
```

This starts the API on an in-memory database (nothing to install or configure, data is lost on exit). Then run `npm start` in a second terminal.

### Player flow (guest)

1. Open **Play** (`/play`). The title shows today's date; the decoder names today's cipher.
2. Click a cell (click it again or press Space to switch across/down) and pick a clue from the lists. The decoder shows the selected clue.
3. Decode it: move the Caesar slider until the clue reads as English, read the Atbash output, or (Vigenère) solve the plain key clue and type that keyword.
4. Type the answer. Tab or Enter jumps to the next clue. Your letters stay after a refresh.

### Player flow (account)

1. **Sign up** (`/signup`) with email, username and password. You are signed in straight away.
2. Open the link in the verification email. In development without SMTP, the email (and link) is printed in the API terminal.
3. Open **Play**. Your letters now save to your account and the timer starts.
4. **Check** marks each clue green (right) or red (wrong); editing clears the marks. **Submit** is enabled once every cell is filled.
5. When solved, the grid locks and shows your time and rank. See **Leaderboard** and your streaks on your **Account** page (click your username).
6. Forgot your password? **Log in** → *Forgot your password?* sends a reset link; resetting signs out your other sessions.

### Visitor flow

1. **Home** (`/`): introduction to Cryp-Cross.
2. **How it works** (`/idea`): the three ciphers and the features.
3. **Team** (`/team`): team member carousel.
4. Use the theme toggle in the header to switch between light and dark mode.

<details>
<summary><strong>API reference</strong></summary>

Base URL: `http://localhost:5000` in development (the Vite dev server proxies `/api`).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/signup` | `{ email, username, password }`: creates the account, signs in and emails a verification link |
| `POST` | `/api/auth/login` | `{ email, password }` |
| `POST` | `/api/auth/logout` | Ends the session |
| `GET` | `/api/auth/me` | The signed-in user (`username`, `email`, `emailVerified`) or `null` |
| `POST` | `/api/auth/verify-email` | `{ token }` from the email link |
| `POST` | `/api/auth/resend-verification` | Signed in: sends a new verification link |
| `POST` | `/api/auth/forgot-password` | `{ email }`: same answer whether or not the account exists |
| `POST` | `/api/auth/reset-password` | `{ token, password }` |
| `GET` | `/api/puzzles/today/progress` | Verified player: your saved `grid`, `startedAt`, `solvedAt`, `timeMs` (starts the timer on first call) |
| `PUT` | `/api/puzzles/today/progress` | `{ date, grid }`: save letters (`409` until you have opened the puzzle with `GET`). `grid` is rows like the layout: `#` blocks, `A-Z` or space in open cells |
| `POST` | `/api/puzzles/today/check` | `{ date, grid }` → `entries`: `right` / `wrong` / `incomplete` per clue |
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
| `401` | Not logged in, or wrong email/password |
| `403` | Foreign `Origin`, or email not verified yet |
| `409` | Username taken, or puzzle already solved |
| `415` | Write request without a JSON body |
| `404` | Puzzle or route not found |
| `413` | Body larger than 10 KB |
| `429` | Rate limit exceeded |
| `500` | Server error (details only in server logs) |

</details>

<details>
<summary><strong>Deployment notes</strong></summary>

- **Backend** (e.g. Render or Railway): root directory `server`, start command `npm start`. Set `DATABASE_URL`, `NODE_ENV=production`, `SESSION_SECRET`, `PUZZLE_SECRET`, `APP_URL`, `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`, `MAIL_FROM`, `CORS_ORIGINS=<your site origin>` and `TRUST_PROXY=1`. The host provides `PORT`. The API refuses to start in production without `SESSION_SECRET`, `PUZZLE_SECRET`, `SMTP_HOST` and `APP_URL`.
- **Cookies**: the session cookie is `SameSite=Lax`, so the API must be on the same site as the frontend: the same origin behind a reverse proxy (leave `VITE_API_URL` empty and route `/api` to the API), or a subdomain of the same domain (e.g. `www.example.com` + `api.example.com`). An API on a different domain (such as a default `*.onrender.com` URL next to a `*.vercel.app` site) will not keep players logged in.
- **Email**: any SMTP provider works (e.g. Resend, Postmark, Mailgun, SES). Verify your sending domain so verification emails don't land in spam.
- **Frontend**: set `VITE_API_URL` and `VITE_SITE_URL` at build time, run `npm run build` (which also writes `sitemap.xml` and `robots.txt`), then `npm run serve`. That passes `-c ../serve.json` so the SPA rewrites and security headers apply. On another static host (e.g. Vercel), copy the headers from `serve.json` into that host's config.
- **HTTPS**: hosts like Render, Railway and Vercel terminate TLS and redirect HTTP to HTTPS. `serve.json` adds HSTS so browsers stay on HTTPS. Add your API origin to the CSP `connect-src` in `serve.json` if you want to drop the generic `https:`.

</details>

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Project Structure

```
Cryp-Cross/
├── .github/workflows/ci.yml   # GitHub Actions CI
├── index.html                 # Vite HTML entry (meta tags, JSON-LD)
├── public/                    # Static files copied as-is: manifest, icons, robots.txt, llms.txt
│   └── img/                   # Team member photos (WebP)
├── scripts/
│   └── generate-seo.js        # Post-build: writes build/sitemap.xml and build/robots.txt
├── src/
│   ├── App.jsx                # Router, theme and layout
│   ├── api.js                 # fetch wrapper (JSON, session cookie, errors)
│   ├── auth/                  # AuthProvider and useAuth
│   ├── components/            # CrosswordGrid, ClueList, CipherTool, PuzzleBoard, NavBar, Footer, VerifyBanner, ...
│   ├── hooks/useCrossword.js  # Grid state reducer (letters, cursor, keyboard)
│   ├── lib/                   # Pure logic: ciphers.js (decoders), grid.js (board navigation), format.js
│   ├── pages/                 # One file per route (Home, Play, Leaderboard, Archive, Idea, Team, auth pages, Account, 404)
│   ├── App.css / index.css    # Styling
│   ├── config.js              # API base URL and site URL
│   ├── usePageMeta.js         # Per-route title, description, canonical and robots tags
│   └── index.jsx              # React entry point
├── server/
│   ├── server.js              # Entry point: connects to MongoDB and starts the API
│   ├── app.js                 # Express app: security middleware, error handling
│   ├── data/words.txt         # Word bank: WORD|clue per line
│   ├── puzzle/                # Generator, ciphers, PRNG, day key, puzzle service
│   ├── models/                # Mongoose schemas (User, DailyPuzzle, Attempt)
│   ├── routes/                # Express routers (auth, puzzles, play: progress/check/submit/leaderboard/stats)
│   ├── lib/                   # Sessions, mailer, one-time tokens, validators
│   ├── middleware/            # requireAuth, requireVerified
│   ├── scripts/dev-memory.js  # Runs the API on a throwaway in-memory MongoDB
│   ├── test/                  # Backend tests (node:test + in-memory MongoDB)
│   └── .env.example           # Backend environment template
├── vite.config.js             # Vite: dev port and /api proxy, build/ output, Vitest settings
├── eslint.config.js           # ESLint flat config (react-hooks, react-refresh)
├── serve.json                 # Production static-server config (rewrites, security headers, caching)
├── .env.example               # Frontend environment template
├── .nvmrc                     # Node version
├── LICENSE
└── package.json               # Frontend dependencies and scripts
```

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Scripts

**Root (frontend)**

| Script | Description |
|--------|-------------|
| `npm start` / `npm run dev` | Start the Vite dev server on port 3000 (proxies `/api` to port 5000) |
| `npm run build` | Production build into `build/`, then `postbuild` generates `sitemap.xml` and `robots.txt` |
| `npm run serve` | Serve `build/` on port 3000 with `serve.json` (rewrites and headers) |
| `npm run preview` | Preview `build/` with Vite (no `serve.json` headers; use `npm run serve` to check those) |
| `npm run lint` | Lint `src/`, configs and scripts with ESLint |
| `npm test` | Run frontend tests once with Vitest (`src/**/*.test.{js,jsx}`; passes when there are none) |

**`server/` (backend)**

| Script | Description |
|--------|-------------|
| `npm start` | Start the Express API |
| `npm run dev` | Start the API and restart on file changes (`node --watch`) |
| `npm run dev:memory` | Start the API on a throwaway in-memory MongoDB (no `DATABASE_URL` needed; data is lost on exit) |
| `npm test` | Run the backend tests (starts an in-memory MongoDB) |

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Testing

The backend has automated tests in `server/test/` (Node's built-in `node:test`). They cover the ciphers, a year of generated puzzles (every answer spelled, no unclued letters, correct numbering), progress/check/submit, the leaderboard and streaks, the account flows (signup, verification, login, logout, password reset and expiry, session invalidation, enumeration resistance, CSRF and rate limits) and the puzzle API against an in-memory MongoDB (`mongodb-memory-server`, downloaded on first install), error handling, CORS and security headers. The frontend has Vitest tests (`src/**/*.test.js`) for the cipher decoders, board navigation the keyboard reducer (fast typing, Backspace, direction toggles, Tab) and time formatting. Every push and pull request to `main` runs [CI](.github/workflows/ci.yml): frontend install, lint, build, Vitest and `npm audit --audit-level=high`, then backend install, syntax check, tests (with an in-memory MongoDB whose binary is cached between runs) and `npm audit --audit-level=high`.

Run the same checks locally:

```bash
npm run lint
```

```bash
npm run build
```

```bash
npm test
```

```bash
npm audit --audit-level=high
```

```bash
npm test --prefix server
```

```bash
npm audit --audit-level=high --prefix server
```

**Manual checks**
- [ ] The API starts and logs `Database Connected`
- [ ] The frontend loads on port 3000; Home, Play, Idea, Team and an unknown URL (404) render
- [ ] On **Play**, typing fills cells and moves along the clue, Space/second click switches direction, Tab moves to the next clue, and letters survive a refresh
- [ ] The decoder turns the selected clue into English with the right Caesar shift, Atbash, or the Vigenère keyword
- [ ] On a phone-width window the grid fits without sideways scrolling
- [ ] Sign up, open the verification link from the API terminal, and the banner disappears
- [ ] As a verified player, letters survive a refresh on another browser, Check marks a wrong clue red, and Submit records a time that appears on the leaderboard and Account page
- [ ] After solving, the grid is locked and Submit is gone
- [ ] Log out, forgot password and reset password work, and the old session is signed out after a reset
- [ ] Each page has its own browser-tab title
- [ ] With `SITE_URL` set, `build/sitemap.xml` lists the six public pages and `build/robots.txt` links to it
- [ ] `npm run serve` responses include `Content-Security-Policy` and `Strict-Transport-Security` headers
- [ ] The theme toggle works and persists after a refresh

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `ECONNREFUSED` on `/api` requests | API not running, or the wrong API URL | Start it with `npm start --prefix server`; check `VITE_API_URL` / `src/config.js` |
| API URL or site URL from `.env` is ignored | Variables still use the old Create React App `REACT_APP_` prefix | Rename them to `VITE_API_URL` / `VITE_SITE_URL` (v0.3.0+) and restart or rebuild |
| `Database connection error` | Wrong `DATABASE_URL` or IP not allowed | Check `server/.env`; add your IP to the MongoDB Atlas access list |
| `DATABASE_URL is not set` on startup | Missing `server/.env` | Copy `server/.env.example` to `server/.env` and fill it in |
| Browser shows a CORS error | Frontend origin isn't in `CORS_ORIGINS` | Add the exact origin (scheme + host + port) to `CORS_ORIGINS` and restart the API |
| Verification email never arrives | No SMTP configured, or it went to spam | In development, copy the link from the API terminal (`[dev mail]`). In production, check `SMTP_*` and the spam folder, then use **Resend email** in the banner. |
| `403 Origin not allowed` when logging in or saving | The site's origin isn't in `CORS_ORIGINS` | Add the exact origin (e.g. `http://localhost:3001` if Vite picked another port) and restart the API |
| Logged out after every API restart in development | No `SESSION_SECRET` set, so a random one is used per start | Set `SESSION_SECRET` in `server/.env` |
| Logged out right after a password reset | By design: a reset signs out all other sessions | Log in with the new password |
| "That solve was too fast to record" | Submitted sooner than `MIN_SOLVE_SECONDS` after opening the puzzle | Wait a few seconds and submit again |
| No Check/Submit buttons on Play | Not logged in, or email not verified | Log in and verify your email |
| Server tests hang on first run | `mongodb-memory-server` is downloading MongoDB (~100 MB, once) | Wait for the download; behind a proxy, see the mongodb-memory-server docs |
| `429 Too many requests` | Rate limit reached | Wait 15 minutes; behind a proxy, set `TRUST_PROXY=1` so users aren't grouped under the proxy IP |
| No `sitemap.xml` in `build/` | `SITE_URL` / `VITE_SITE_URL` not set | Set it and rebuild |
| Security headers missing in production | Server started without the config | Use `npm run serve` (passes `-c ../serve.json`) |
| Port already in use | Another process on 3000/5000 | Windows: `netstat -ano \| findstr :5000`, then `taskkill /PID <PID> /F` |

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Contributing

- **Branches:** `feat/short-description`, `fix/short-description`, `docs/...`, `chore/...`
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) with the bumped SemVer version at the end of the subject, e.g. `feat: add CSV export (v0.2.0)`. Breaking change → minor while on `0.x`; `feat` → minor; everything else → patch. Bump `package.json` and the version badge in the same commit.
- Make sure CI checks pass locally before committing.
- **Update this README with every change.**

<details>
<summary><strong>SEO backlink ideas</strong></summary>

- Link the live site from the GitHub repository description and topics (`react`, `mern`, `crossword`, `cipher`, `cryptography`, `puzzle`)
- Add it to team members' GitHub profile READMEs, LinkedIn and portfolios
- Write a short dev post (DEV.to, Hashnode, Medium) about building Cryp-Cross and link back
- Submit it to course or school project showcases and puzzle and cryptography communities (r/crossword, r/codes, puzzle newsletters)

</details>

<p align="right"><a href="#readme-top">back to top</a></p>

---

## License

Licensed under the **Sprucetrap Source-Available License 1.0**. See [LICENSE](LICENSE). Non-commercial use, study and modification are allowed with visible credit: "Based on Cryp-Cross by Sprucetrap (https://github.com/Jevoel16)". Commercial use needs written permission.

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Author

**Sprucetrap** ([@Jevoel16](https://github.com/Jevoel16)), for CCC181 Lab Activity Final (Orbilla team).

<p align="right"><a href="#readme-top">back to top</a></p>
