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
    <img src="https://img.shields.io/badge/@fontsource/space--grotesk-5.3.0-blue?style=flat" alt="@fontsource/space-grotesk 5.3.0" />
    <img src="https://img.shields.io/badge/@fontsource/jetbrains--mono-5.3.0-blue?style=flat" alt="@fontsource/jetbrains-mono 5.3.0" />
    <img src="https://img.shields.io/badge/express-4.22.3-blue?style=flat" alt="Express 4.22.3" />
    <img src="https://img.shields.io/badge/mongoose-7.8.13-blue?style=flat" alt="Mongoose 7.8.13" />
    <img src="https://img.shields.io/badge/helmet-8.3.0-blue?style=flat" alt="helmet 8.3.0" />
    <img src="https://img.shields.io/badge/express--rate--limit-7.5.1-blue?style=flat" alt="express-rate-limit 7.5.1" />
    <img src="https://img.shields.io/badge/express--session-1.19.0-blue?style=flat" alt="express-session 1.19.0" />
    <img src="https://img.shields.io/badge/connect--mongo-6.0.0-blue?style=flat" alt="connect-mongo 6.0.0" />
    <img src="https://img.shields.io/badge/bcryptjs-3.0.3-blue?style=flat" alt="bcryptjs 3.0.3" />
    <img src="https://img.shields.io/badge/mongodb--memory--server-10.4.3-blue?style=flat" alt="mongodb-memory-server 10.4.3" />
    <img src="https://img.shields.io/badge/node-22-blue?style=flat" alt="Node 22" />
  </p>
  <p>
    <img src="https://img.shields.io/badge/version-2.0.0-green?style=flat" alt="Version 2.0.0" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-Sprucetrap%20Source--Available-orange?style=flat" alt="License: Sprucetrap Source-Available" /></a>
    <img src="https://img.shields.io/badge/platform-web-lightgrey?style=flat" alt="Platform: web" />
    <img src="https://img.shields.io/badge/hosting-Vercel-lightgrey?style=flat" alt="Hosting: Vercel" />
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

Cryp-Cross is a free daily crossword where every clue is encrypted. Each day the server generates one grid for everyone and hides its clues behind a classical cipher (Caesar, Atbash or Vigenère). Players crack the cipher with a built-in decoder, fill the grid, and check and submit their answers. Guests play unranked; with a free account, solves are timed by the server and climb the leaderboard. It is a MERN app (MongoDB, Express, React, Node.js).

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Features

**Frontend (React)**
- **Play page** (`/play`): today's grid with keyboard and touch input (letters, Backspace, arrows, Space to switch direction, Tab/Enter for the next clue), across/down clue lists, and the current clue above the grid
- **Decoder workbench** for the day's cipher: a Caesar shift slider with an "all 25 shifts" view, Atbash, and Vigenère with a keyword box and the plain key clue
- Unsaved letters are kept per browser, so a refresh doesn't lose them
- **Guest play**: without an account, **Check** and **Submit** still work and a timer runs in the browser, but the solve is unranked: nothing is stored on the server
- **For signed-in players**: progress saved to the server as you type, a running timer, **Check** (marks each clue right, wrong or unfinished without revealing answers) and **Submit** (one timed solve per day, then the grid locks)
- **Leaderboard** (`/leaderboard`): today's fastest solves, or any past day with `?date=YYYY-MM-DD`
- **Archive** (`/puzzles`, `/puzzles/:date`): past days with the solution, decoded clues and the cipher key
- **Account stats**: puzzles solved, current and best streak, best time and recent solves
- Info pages: Home, How it works (`/idea`) and a Team carousel
- **Accounts through GitHub or Google only**: the first sign-in creates the account (no email address is asked for or stored). Buttons appear only for providers configured on the API.
- **Account page**: change the username, add or change a password for username + password login, connect or disconnect GitHub/Google, and see your stats
- **Dark cipher-terminal design**: deep ink background with a faint grid, glassy cards, a lime accent taken from the puzzle-piece logo and cyan cipher text; Space Grotesk for the interface and JetBrains Mono for ciphers and the grid. The logo appears in the header, the home hero and the footer.
- Home page hero with a one-time "decrypt" animation of the tagline, today's cipher at a glance, and a Decode / Fill / Race walkthrough
- Play page with a glowing cursor and active entry, right/wrong marks, a Ranked or Guest badge with a timer pill, and the decoder styled as a terminal pane that stays in view beside the grid
- Leaderboard with gold, silver and bronze ranks and your own row highlighted; stat tiles on the Account page
- Sticky header with a mobile menu, a skip link, visible focus rings and `prefers-reduced-motion` support (animations off)
- Dark theme by default with a light theme toggle; the choice is remembered in `localStorage`, and without one the site follows the system setting. `public/theme.js` applies it before the app renders, so there is no flash.
- Client-side routing with React Router and a 404 page
- SEO: a unique title, description and canonical URL per page, `noindex` on the error page, JSON-LD, Open Graph tags, `llms.txt`, and a `sitemap.xml` + `robots.txt` generated at build time
- Optimized assets: WebP team photos at display size and correctly sized app icons
- Production security headers via `vercel.json` on Vercel or `serve.json` when self-hosting (CSP, HSTS, `nosniff`, frame blocking) and long-term caching for hashed static files

**Backend (Express)**
- **Daily cipher crossword generator**: each day (in `PUZZLE_TZ`) a crossword of 8–12 words is built from `server/data/words.txt`, deterministically from the date, and stored in MongoDB so it never changes afterwards
- **Encrypted clues**: the day's cipher is Caesar (hidden shift), Atbash, or Vigenère (the key is the answer to an extra plain-text key clue)
- Puzzle API: today's puzzle without answers or keys, plus an archive of past played days with answers revealed
- **Guest check** (`POST /api/puzzles/today/guest-check`): grades a grid per clue for anyone, stores nothing and never touches the leaderboard
- **Attempts**: per-player progress, server-side answer checking, timed submissions (the timer starts only when a signed-in player opens the day with `GET /progress`; saving, checking and submitting require that, solves faster than `MIN_SOLVE_SECONDS` are refused, and the puzzle seed includes `PUZZLE_SECRET` so answers can't be computed in advance), a leaderboard that exposes only usernames and times, and streak stats
- **Accounts**: created by GitHub/Google sign-in and stored as username + provider IDs, with no email address. An optional password (bcrypt, cost 12) enables username login. Setting or changing it needs the current password or a GitHub/Google sign-in within the last 10 minutes (that is also the forgot-password path), and it signs out every other session. Sessions live in MongoDB behind an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production).
- **OAuth sign-in** (GitHub, Google): authorization-code flow with `state` and PKCE, written with Node's built-in `fetch` (no extra dependencies). Only the public profile is requested (GitHub: no scope; Google: `openid profile`). Accounts are matched by provider user ID; a new one gets a username from the GitHub login or Google name. GitHub and Google are joined only by connecting the second one from the Account page, and the last way to sign in can't be disconnected. Access tokens are used once and never stored or logged.
- Brute-force protection: 10 login, password-change and OAuth attempts per 15 minutes per IP, and constant-time login answers that don't reveal whether a username exists
- CSRF protection for cookie-authenticated writes: foreign `Origin` headers are refused and writes must be JSON
- 10 KB JSON body limit
- Security headers with `helmet`, a CORS allow-list (`CORS_ORIGINS`) and rate limiting (300 requests / 15 min per IP, 60 writes). Rate-limit counters live in MongoDB, so the limits hold across serverless instances on Vercel.
- Generic error responses: no internal messages or stack traces reach clients
- Environment-based configuration with `dotenv`

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Vite 8 (build and dev server), plain CSS with design tokens, self-hosted Space Grotesk and JetBrains Mono (Fontsource) |
| Frontend tooling | ESLint 10 (flat config, react-hooks plugin), Vitest 5 |
| Backend testing | node:test, mongodb-memory-server (in-memory MongoDB) |
| Backend | Node.js 22, Express 4, Mongoose 7, express-session + connect-mongo, bcryptjs, helmet, express-rate-limit, cors, dotenv |
| Database | MongoDB (MongoDB Atlas recommended) |
| Hosting | Vercel: static `build/` plus the API as a serverless function (`api/index.js`) on one origin. Self-hosting: `serve` with `serve.json` and `npm start --prefix server`. |
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
| `APP_URL` | in production | Public site URL, the destination after GitHub/Google sign-in (default `http://localhost:3000`) |
| `API_URL` | no | Public origin of the API, used to build the OAuth callback URLs. Leave empty when the API is on the same origin as the site (or behind the Vite proxy in development); it then defaults to `APP_URL`. |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | at least one provider | Enables **Continue with GitHub**, the only way (with Google) to create an account. Both must be set; with one missing the button stays hidden and the API warns at startup. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | no | Enables **Continue with Google**, same rules as GitHub |
| `AUTH_RATE_LIMIT` | no | Login, password-change and OAuth attempts per IP per 15 minutes (default `10`) |
| `PUZZLE_SECRET` | in production | Secret mixed into the puzzle seed (HMAC of the date), so future puzzles can't be generated from the public source. Changing it only affects puzzles not yet created. |
| `MIN_SOLVE_SECONDS` | no | Correct submissions sooner than this after opening the puzzle are refused (default `30`) |
| `PUZZLE_TZ` | no | IANA time zone that decides when the daily puzzle changes (default `UTC`) |
| `TRUST_PROXY` | on Vercel | Set to `1` behind one reverse proxy (Vercel, Render, Railway) so rate limiting sees real client IPs. Default `0`. |
| `NODE_ENV` | no | Set to `production` in production |

**Frontend:** optional, set in a root `.env` file or in your hosting provider.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | no | Base URL of the API when it is on another origin. Empty (default) means same origin: in development Vite proxies `/api` to `http://localhost:5000`. |
| `VITE_SITE_URL` | in production | Public site URL (https, no trailing slash). Used for canonical links and to generate `sitemap.xml` / `robots.txt` after `npm run build`. `SITE_URL` also works for the sitemap step. Vite only exposes variables prefixed with `VITE_` to the browser bundle, so never put secrets in them. |

See `.env.example` for a template.

<details>
<summary><strong>Setting up GitHub and Google sign-in</strong></summary>

The callback URL is `<API_URL or APP_URL>/api/auth/oauth/<provider>/callback`. In development (Vite on port 3000 proxying `/api`) that is:

- `http://localhost:3000/api/auth/oauth/github/callback`
- `http://localhost:3000/api/auth/oauth/google/callback`

In production use your real https origin. On Vercel that is `https://<project>.vercel.app/api/auth/oauth/github/callback` and `.../google/callback`.

**GitHub**
1. Go to GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**.
2. Homepage URL: your `APP_URL`. Authorization callback URL: the GitHub callback above.
3. Create the app, then **Generate a new client secret**.
4. Put the Client ID and secret in `server/.env` as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`, and restart the API.

**Google**
1. In the Google Cloud console, open APIs & Services → **OAuth consent screen** and set it up (External, app name, support email; scopes `openid` and `profile`).
2. APIs & Services → Credentials → **Create credentials → OAuth client ID**, type **Web application**.
3. Authorized redirect URI: the Google callback above.
4. Put the Client ID and secret in `server/.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and restart the API.

Use separate OAuth apps (or at least separate redirect URIs) for development and production. Keep the secrets in `server/.env` or your host's secret settings, never in the frontend.

</details>

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
4. Type the answer. Tab or Enter jumps to the next clue. Your letters stay after a refresh, and the guest timer starts with your first letter.
5. **Check** marks each clue green or red; **Submit** (once every cell is filled) shows "Solved in 4:12 · not ranked". Guest solves never appear on the leaderboard.

### Player flow (account)

1. **Log In** (`/login`) → **Continue with GitHub** or **Continue with Google**. The first time, this creates your account with a username from your GitHub login or Google name. No email address is asked for or stored.
2. Open **Play**. Your letters now save to your account and the timer starts.
3. **Check** marks each clue green (right) or red (wrong); editing clears the marks. **Submit** is enabled once every cell is filled.
4. When solved, the grid locks and shows your time and rank. See **Leaderboard** and your streaks on your **Account** page (click your username).
5. On **Account**, change the generated username, connect the other provider, and optionally **Add a password**. Right after a GitHub/Google sign-in no current password is needed; later, changing it asks for the current one.
6. With a password set, log in on `/login` with **username + password** instead.
7. Forgot your password? On **Account**, use *Sign in again with GitHub/Google*, then set a new password within 10 minutes. Saving it signs out your other sessions.

### Visitor flow

1. **Home** (`/`): introduction to Cryp-Cross.
2. **How it works** (`/idea`): the three ciphers and the features.
3. **Team** (`/team`): team member carousel.
4. Use the sun/moon button in the header to switch between the dark and light themes. On a phone, the menu button opens the page links.

<details>
<summary><strong>API reference</strong></summary>

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

</details>

### Deploy to Vercel

The site and the API run in one Vercel project on one origin: `vercel.json` builds the frontend into `build/`, serves it with the security headers, and rewrites `/api/*` to the serverless function `api/index.js`, which runs the same Express app as `server/`. Because both share an origin, the `SameSite=Lax` session cookie works and `VITE_API_URL` stays empty.

1. **Database**: create a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and a database user. Under Network Access allow `0.0.0.0/0` (Vercel functions have no fixed IPs). Copy the connection string.
2. **Sign-in**: create a production GitHub OAuth app and/or Google OAuth client (see *Setting up GitHub and Google sign-in* above). They are the only way to create accounts.
3. **Import**: on [vercel.com](https://vercel.com) choose **Add New > Project** and import `Jevoel16/Cryp-Cross`. Leave the framework preset as **Other**; install, build and output settings come from `vercel.json`.
4. **Environment variables** (Production), with `<site>` = `https://<project>.vercel.app`:

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Atlas connection string |
   | `SESSION_SECRET`, `PUZZLE_SECRET` | two different long random strings, e.g. from `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `APP_URL`, `CORS_ORIGINS`, `VITE_SITE_URL` | `<site>` |
   | `TRUST_PROXY` | `1` |
   | `GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET` | at least one pair, from the production OAuth apps |
   | `PUZZLE_TZ`, `MIN_SOLVE_SECONDS`, `AUTH_RATE_LIMIT` | optional |

5. **Deploy**, then register `<site>/api/auth/oauth/github/callback` and `<site>/api/auth/oauth/google/callback` with the OAuth apps.
6. From then on every push to `main` deploys to production, and other branches get preview URLs. Previews have a different origin, so logins there are refused unless you set Preview variables to match.

**Upgrading a 1.x database**: the API drops the old unique email index on startup. Old email + password accounts keep working through username + password login (stored email fields are ignored), and can connect GitHub or Google from the Account page.

With a custom domain later, update `APP_URL`, `CORS_ORIGINS`, `VITE_SITE_URL` and the OAuth callback URLs, then redeploy. Vercel's free Hobby plan is for non-commercial use, which matches this project's license.

<details>
<summary><strong>Self-hosting notes (without Vercel)</strong></summary>

- **Backend** (e.g. Render or Railway): root directory `server`, start command `npm start`. Set the same variables as above plus `TRUST_PROXY=1`; the host provides `PORT`.
- **Cookies**: the session cookie is `SameSite=Lax`, so the API must be on the same site as the frontend: the same origin behind a reverse proxy (leave `VITE_API_URL` empty and route `/api` to the API), or a subdomain of the same domain. An API on a different domain will not keep players logged in.
- **Frontend**: set `VITE_SITE_URL` (and `VITE_API_URL` if needed) at build time, run `npm run build`, then `npm run serve`, which applies `serve.json` (SPA rewrites and security headers). If the API is on another origin, add it to the CSP `connect-src` in `serve.json`.

</details>

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Project Structure

```
Cryp-Cross/
├── .github/workflows/ci.yml   # GitHub Actions CI
├── api/index.js               # Vercel serverless entry: connects to MongoDB once per instance, runs the Express app
├── index.html                 # Vite HTML entry (meta tags, JSON-LD)
├── public/                    # Static files copied as-is: manifest, icons, robots.txt, llms.txt
│   ├── theme.js               # Applies the saved/system theme before React renders (no flash)
│   └── img/                   # Logo (logo-72.webp, logo-440.webp) and team photos (WebP)
├── scripts/
│   └── generate-seo.js        # Post-build: writes build/sitemap.xml and build/robots.txt
├── src/
│   ├── App.jsx                # Router, theme and layout
│   ├── api.js                 # fetch wrapper (JSON, session cookie, errors)
│   ├── auth/                  # AuthProvider and useAuth
│   ├── components/            # CrosswordGrid, ClueList, CipherTool, PuzzleBoard, NavBar, Footer, OAuthButtons, DecryptText, ...
│   ├── hooks/useCrossword.js  # Grid state reducer (letters, cursor, keyboard)
│   ├── lib/                   # Pure logic: ciphers.js (decoders), grid.js (board navigation), format.js
│   ├── pages/                 # One file per route (Home, Play, Leaderboard, Archive, Idea, Team, Login, Account, 404)
│   ├── App.css / index.css    # Design tokens (dark and light themes) and component styles
│   ├── config.js              # API base URL and site URL
│   ├── usePageMeta.js         # Per-route title, description, canonical and robots tags
│   └── index.jsx              # React entry point
├── server/
│   ├── server.js              # Self-hosted entry point: connects to MongoDB and starts the API
│   ├── app.js                 # Express app: security middleware, error handling
│   ├── data/words.txt         # Word bank: WORD|clue per line
│   ├── puzzle/                # Generator, ciphers, PRNG, day key, puzzle service
│   ├── models/                # Mongoose schemas (User, DailyPuzzle, Attempt)
│   ├── routes/                # Express routers (auth, oauth, puzzles, play: progress/check/submit/guest-check/leaderboard/stats)
│   ├── lib/                   # Sessions, MongoDB rate-limit store, env checks, DB connection, validators, OAuth
│   ├── middleware/            # requireAuth
│   ├── scripts/dev-memory.js  # Runs the API on a throwaway in-memory MongoDB
│   ├── test/                  # Backend tests (node:test + in-memory MongoDB)
│   └── .env.example           # Backend environment template
├── vite.config.js             # Vite: dev port and /api proxy, build/ output, Vitest settings
├── eslint.config.js           # ESLint flat config (react-hooks, react-refresh)
├── vercel.json                # Vercel: install/build commands, /api rewrite, SPA fallback, security headers
├── serve.json                 # Self-hosted static-server config (rewrites, security headers, caching)
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

The backend has automated tests in `server/test/` (Node's built-in `node:test`). They cover the ciphers, a year of generated puzzles (every answer spelled, no unclued letters, correct numbering), progress/check/submit, the leaderboard and streaks, the account flows (username login, setting and changing a password, the 10-minute OAuth recovery window, session invalidation, no stored email, CSRF and rate limits), GitHub/Google sign-in against a fake OAuth provider (state and PKCE, no email scope, account creation, connect/disconnect, unsafe redirects, username changes), the MongoDB rate-limit store, guest checks and the puzzle API against an in-memory MongoDB (`mongodb-memory-server`, downloaded on first install), error handling, CORS and security headers. The frontend has Vitest tests (`src/**/*.test.js`) for the cipher decoders, board navigation the keyboard reducer (fast typing, Backspace, direction toggles, Tab) and time formatting. Every push and pull request to `main` runs [CI](.github/workflows/ci.yml): frontend install, lint, build, Vitest and `npm audit --audit-level=high`, then backend install, syntax check, tests (with an in-memory MongoDB whose binary is cached between runs) and `npm audit --audit-level=high`.

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
- [ ] As a guest, Check marks a wrong clue red, Submit on a full correct grid shows "not ranked", and the leaderboard is unchanged
- [ ] With `GITHUB_CLIENT_ID`/`SECRET` set, **Continue with GitHub** creates an account (GitHub's consent screen asks for no email), and returns to the page you came from; without them the button is hidden
- [ ] On **Account**, change the username, connect a second provider and disconnect one; disconnecting the only sign-in method is refused
- [ ] As a signed-in player, letters survive a refresh on another browser, Check marks a wrong clue red, and Submit records a time that appears on the leaderboard and Account page
- [ ] After solving, the grid is locked and Submit is gone
- [ ] On **Account**, add a password right after a GitHub sign-in, log out, and log in with username + password; changing it later asks for the current one and signs out other browsers
- [ ] Each page has its own browser-tab title
- [ ] With `SITE_URL` set, `build/sitemap.xml` lists the six public pages and `build/robots.txt` links to it
- [ ] `npm run serve` responses include `Content-Security-Policy` and `Strict-Transport-Security` headers
- [ ] After a Vercel deploy: `curl -I <site>/play` shows the CSP and HSTS headers, `<site>/api/puzzles/today` returns JSON, and GitHub/Google sign-in, adding a password, username login and ranked submit work on the live site
- [ ] The theme toggle switches between dark and light and persists after a refresh; with no saved choice the site follows the system theme
- [ ] At 375px wide the header collapses into a menu button, and Home, Play and Account have no sideways scrolling
- [ ] With "reduce motion" turned on in the OS, the tagline, logo and cursor do not animate

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
| `403 Origin not allowed` when logging in or saving | The site's origin isn't in `CORS_ORIGINS` | Add the exact origin (e.g. `http://localhost:3001` if Vite picked another port) and restart the API |
| Logged out after every API restart in development | No `SESSION_SECRET` set, so a random one is used per start | Set `SESSION_SECRET` in `server/.env` |
| Logged out right after a password change | By design: a change signs out all other sessions | Log in with the new password |
| "Current password is wrong" and you forgot it | Changing a password needs proof | On **Account**, *Sign in again with GitHub/Google*, then set a new password within 10 minutes |
| GitHub and Google created two accounts | Accounts are matched by provider ID, not email | Sign in to the one you keep, then **Connect** the other provider on **Account** (only works if that provider isn't already on another account) |
| "That solve was too fast to record" | Submitted sooner than `MIN_SOLVE_SECONDS` after opening the puzzle | Wait a few seconds and submit again |
| My solve isn't on the leaderboard | Guests play unranked | Sign in with GitHub or Google before you start the puzzle |
| No GitHub/Google buttons (nobody can create an account) | The provider's client ID or secret isn't set on the API | Set both in `server/.env` (or Vercel) and restart or redeploy |
| GitHub/Google shows "redirect_uri mismatch" | The callback URL registered with the provider differs from `<API_URL or APP_URL>/api/auth/oauth/<provider>/callback` | Register exactly that URL (scheme, host, port and path) |
| "That sign-in link expired or was opened in another browser" | The sign-in took more than 10 minutes, or cookies are blocked | Try again in the same browser and allow cookies for the site |
| Server tests hang on first run | `mongodb-memory-server` is downloading MongoDB (~100 MB, once) | Wait for the download; behind a proxy, see the mongodb-memory-server docs |
| `429 Too many requests` | Rate limit reached | Wait 15 minutes; behind a proxy, set `TRUST_PROXY=1` so users aren't grouped under the proxy IP |
| No `sitemap.xml` in `build/` | `SITE_URL` / `VITE_SITE_URL` not set | Set it and rebuild |
| Security headers missing in production | Server started without the config | On Vercel they come from `vercel.json`; self-hosted, use `npm run serve` (passes `-c ../serve.json`) |
| Vercel: `/api/...` returns `503 Service unavailable` | The function couldn't start: a required variable is missing or Atlas refused the connection | Check the function logs in Vercel, set the missing variables, and allow `0.0.0.0/0` in Atlas Network Access |
| Vercel: `403 Origin not allowed` on login | `CORS_ORIGINS` doesn't match the URL you opened (e.g. a preview URL) | Set `CORS_ORIGINS` to that exact origin and redeploy |
| Port already in use | Another process on 3000/5000 | Windows: `netstat -ano \| findstr :5000`, then `taskkill /PID <PID> /F` |

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Contributing

- **Branches:** `feat/short-description`, `fix/short-description`, `docs/...`, `chore/...`
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) with the bumped SemVer version at the end of the subject, e.g. `feat: add CSV export (v2.1.0)`. Breaking change → major; `feat` → minor; everything else → patch. Bump `package.json` and the version badge in the same commit.
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
