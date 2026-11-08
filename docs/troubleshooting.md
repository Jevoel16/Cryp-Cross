# Troubleshooting

Common problems when running or deploying [Cryp-Cross](../README.md), with their cause and fix.

| Problem | Cause | Fix |
|---------|-------|-----|
| `ECONNREFUSED` on `/api` requests | API not running, or the wrong API URL | Start it with `npm start --prefix server`; check `VITE_API_URL` / `src/config.js` |
| API URL or site URL from `.env` is ignored | Variables still use the old Create React App `REACT_APP_` prefix | Rename them to `VITE_API_URL` / `VITE_SITE_URL` (v0.3.0+) and restart or rebuild |
| `Database connection error` | Wrong `DATABASE_URL` or IP not allowed | Check `server/.env`; add your IP to the MongoDB Atlas access list |
| `DATABASE_URL is not set` on startup | Missing `server/.env` | Copy the Local block of `server/.env.example` into `server/.env` and fill it in |
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
| "That sign-in link expired or was opened in another browser" | The sign-in took more than 10 minutes, cookies are blocked, or (before v2.0.4) the site was opened on a different domain than `APP_URL`, so the OAuth callback landed on a host without your session cookie | Try again in the same browser with cookies allowed. Since v2.0.4 a sign-in started on another domain first moves to the callback host; still set `APP_URL`, `CORS_ORIGINS` and `VITE_SITE_URL` to the domain you want people on and redeploy |
| "Too many sign-in attempts from your network" (or raw `Too many attempts` JSON before v2.0.5) | More than `OAUTH_RATE_LIMIT` GitHub/Google sign-in requests from your IP in 15 minutes (each sign-in uses two) | Wait up to 15 minutes, or raise `OAUTH_RATE_LIMIT` in Vercel and redeploy |
| Server tests hang on first run | `mongodb-memory-server` is downloading MongoDB (~100 MB, once) | Wait for the download; behind a proxy, see the mongodb-memory-server docs |
| `429 Too many requests` | Rate limit reached | Wait 15 minutes; behind a proxy, set `TRUST_PROXY=1` so users aren't grouped under the proxy IP |
| No `sitemap.xml` in `build/` | `SITE_URL` / `VITE_SITE_URL` not set | Set it and rebuild |
| Security headers missing in production | Server started without the config | On Vercel they come from `vercel.json`; self-hosted, use `npm run serve` (passes `-c ../serve.json`) |
| Vercel: `/api/...` returns `503 Service unavailable` | The function couldn't start: a required variable is missing or Atlas refused the connection | Check the function logs in Vercel, set the missing variables, and allow `0.0.0.0/0` in Atlas Network Access |
| Vercel: `403 Origin not allowed` on login or guest Check/Submit | Before v2.0.2, the API needed `CORS_ORIGINS` to list the exact URL you opened and `TRUST_PROXY=1` to see https | Update to v2.0.2+, or set both and redeploy |
| Custom domain: sitemap/canonical still show `vercel.app`, or sign-in lands on `vercel.app` | `VITE_SITE_URL` / `APP_URL` still point at the old domain | Follow *Custom domain* under Deploy to Vercel and redeploy |
| Port already in use | Another process on 3000/5000 | Windows: `netstat -ano \| findstr :5000`, then `taskkill /PID <PID> /F` |
