# Features

The full feature list of Cryp-Cross, frontend and backend.

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
- **Plain, consistent design**: one set of spacing, type, radius and colour tokens; a lime accent (from the puzzle-piece logo) only for actions and state, cyan only for cipher text; Space Grotesk for the interface and JetBrains Mono only for cipher text, the grid and numbers. No decorative glows, gradients or animations.
- Home page with a sample board and a decoded example clue, today's cipher at a glance, and a Decode / Fill / Race walkthrough
- Play page with a highlighted cursor and active entry, right/wrong marks, a Ranked or Guest badge with a timer, and a decoder panel that stays in view beside the grid
- Leaderboard with gold, silver and bronze ranks and your own row highlighted; stat tiles on the Account page
- Sticky header with a mobile menu, a skip link, visible focus rings and `prefers-reduced-motion` support (animations and team auto-advance off, with a pause button)
- Loading skeletons that reserve space (no layout shift), plus empty and error states for every async view
- One SVG icon set (2px strokes, 18px) for the theme toggle, menu, timer and team arrows
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

[Back to README](../README.md)
